/* ============================================================
   gerber.ts — RS-274X (extended Gerber) parser.
   Purpose: the hero board can be swapped from the procedural
   model to Hazem's REAL copper by feeding exported Gerber files.
   Built for 2-layer boards (copper/silk/mask layers).

   Output is layer-agnostic geometry: strokes (traces), flashes
   (pads/vias), and regions (copper pours). Conversion to
   three.js objects happens in the scene layer.

   Supported: FS, MO, LP, AD (C/R/O), D01/D02/D03, G36/G37,
   G01, units, deprecated G54/G55. Arc interpolation (G02/G03)
   is approximated as a straight segment (warned once).
   ============================================================ */

export interface GerberStroke {
  pts: [number, number][]
  width: number
}

export interface GerberFlash {
  shape: 'circle' | 'rect' | 'obround'
  x: number
  y: number
  w: number
  h: number
  hole: number
}

export interface GerberRegion {
  contours: [number, number][][]
}

export interface GerberData {
  unit: 'mm' | 'in'
  strokes: GerberStroke[]
  flashes: GerberFlash[]
  regions: GerberRegion[]
  warnings: string[]
}

interface FormatSpec {
  xInt: number
  xDec: number
  yInt: number
  yDec: number
  zero: 'L' | 'T'
  notation: 'A' | 'I'
}

interface Aperture {
  code: number
  shape: 'circle' | 'rect' | 'obround' | 'poly'
  w: number
  h: number
  hole: number
}

function parseCoord(raw: string, intDigits: number, decDigits: number, zero: 'L' | 'T'): number {
  if (raw === '' || raw === '+' || raw === '-') return 0
  let sign = 1
  let s = raw
  if (s.startsWith('-')) {
    sign = -1
    s = s.slice(1)
  } else if (s.startsWith('+')) {
    s = s.slice(1)
  }
  const total = intDigits + decDigits
  if (zero === 'L') {
    // leading zeros omitted -> pad left
    s = s.padStart(total, '0')
  } else {
    // trailing zeros omitted -> pad right
    s = s.padEnd(total, '0')
  }
  const intPart = s.slice(0, intDigits) || '0'
  const decPart = s.slice(intDigits) || '0'
  return sign * (parseInt(intPart, 10) + parseInt(decPart, 10) / 10 ** decDigits)
}

export function parseGerber(text: string): GerberData {
  const warnings: string[] = []
  const out: GerberData = {
    unit: 'mm',
    strokes: [],
    flashes: [],
    regions: [],
    warnings,
  }

  let fs: FormatSpec | null = null
  let scale = 1 // to mm
  let unitSet = false

  const apertures = new Map<number, Aperture>()
  let current: Aperture | null = null

  let x = 0
  let y = 0

  let interpolation: 'D01' | 'D02' = 'D02'
  let inRegion = false
  let regionContours: [number, number][][] = []
  let contour: [number, number][] = []

  let stroke: GerberStroke | null = null

  const warn = (msg: string) => {
    if (warnings.length < 32 && !warnings.includes(msg)) warnings.push(msg)
  }

  const endStroke = () => {
    if (stroke && stroke.pts.length > 1) out.strokes.push(stroke)
    stroke = null
  }

  const endContour = () => {
    if (contour.length > 2) {
      // close if not closed
      const a = contour[0]
      const b = contour[contour.length - 1]
      if (a[0] !== b[0] || a[1] !== b[1]) contour.push([a[0], a[1]])
      regionContours.push(contour)
    }
    contour = []
  }

  const lines = text.split(/\r?\n/)

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // --- extended commands: %...% ---
    if (line.startsWith('%')) {
      const body = line.replace(/^%/, '').replace(/%$/, '').replace(/\*$/, '')

      if (body.startsWith('FSLAIJ') || body.startsWith('FS')) {
        // e.g. FSLAX36Y36*
        const m = body.match(/^FS([LT])[AI]X(\d)(\d)Y(\d)(\d)/)
        if (m) {
          fs = {
            zero: m[1] as 'L' | 'T',
            notation: 'A',
            xInt: parseInt(m[2], 10),
            xDec: parseInt(m[3], 10),
            yInt: parseInt(m[4], 10),
            yDec: parseInt(m[5], 10),
          }
        }
      } else if (body.startsWith('MO')) {
        if (body.includes('MM')) {
          out.unit = 'mm'
          scale = 1
        } else if (body.includes('IN')) {
          out.unit = 'in'
          scale = 25.4
        }
        unitSet = true
      } else if (body.startsWith('LP')) {
        // LP D / LP C — polarity. We render everything dark/clear-agnostic.
        // Clear polarity (C) is uncommon on simple 2-layer copper; warn if seen.
        if (body.includes('C')) warn('LP C (clear polarity) found — rendered as dark')
      } else if (body.startsWith('ADD')) {
        // ADD10C,0.25*  /  ADD11R,1.6X0.8X0.0*
        const m = body.match(/^ADD(\d+)([CRO]),(.+)$/)
        if (m) {
          const code = parseInt(m[1], 10)
          const shape = m[2] as 'C' | 'R' | 'O'
          const params = m[3].split('X').map((v) => parseFloat(v))
          let w = 0
          let h = 0
          let hole = 0
          if (shape === 'C') {
            w = h = params[0] || 0
            hole = params[1] || 0
          } else {
            w = params[0] || 0
            h = params[1] || 0
            hole = params[2] || 0
          }
          apertures.set(code, {
            code,
            shape: shape === 'C' ? 'circle' : shape === 'R' ? 'rect' : 'obround',
            w,
            h,
            hole,
          })
        }
      } else if (body.startsWith('AM')) {
        warn('macro aperture (AM) skipped')
      } else if (body.startsWith('TF') || body.startsWith('TD') || body.startsWith('TA')) {
        // attributes — ignore
      }
      continue
    }

    // --- function commands ---

    // G-codes
    if (/^G04/.test(line)) continue // comment

    const gMatch = line.match(/^G0?([1-9]+)/)
    if (gMatch) {
      const g = parseInt(gMatch[1], 10)
      if (g === 36) {
        inRegion = true
        regionContours = []
        contour = []
        endStroke()
        continue
      }
      if (g === 37) {
        endContour()
        inRegion = false
        out.regions.push({ contours: regionContours })
        regionContours = []
        continue
      }
      if (g === 1) {
        interpolation = 'D01'
      } else if (g === 2 || g === 3) {
        interpolation = 'D01'
        warn('arc interpolation approximated as straight line')
      } else if (g === 70) {
        out.unit = 'in'
        scale = 25.4
        unitSet = true
      } else if (g === 71) {
        out.unit = 'mm'
        scale = 1
        unitSet = true
      }
      // G54/G55 (deprecated tool select) fall through
    }

    // aperture select: Dnn
    const dSel = line.match(/^D0*(\d{2,})$/)
    if (dSel) {
      const code = parseInt(dSel[1], 10)
      if (code >= 10) {
        const ap = apertures.get(code)
        if (ap) {
          if (current !== ap) endStroke()
          current = ap
        } else {
          warn(`aperture D${code} used before definition`)
        }
        continue
      }
      if (code === 1) {
        interpolation = 'D01'
        continue
      }
      if (code === 2) {
        interpolation = 'D02'
        continue
      }
      if (code === 3) continue
    }

    // coordinate + operation
    const op = line.match(
      /^(?:G0?[123])?(X[-+]?\d+)?(?:Y[-+]?\d+)?[^\d]*?(X[-+]?\d+)?(?:Y[-+]?\d+)?(D0?[123])?$/,
    )
    const opMatch = line.match(/^(.*?)(D0?[123])?$/)
    void op

    if (opMatch) {
      const coordPart = opMatch[1] ?? ''
      const opCode = opMatch[2] ?? ''

      const xm = coordPart.match(/X([-+]?\d+)/)
      const ym = coordPart.match(/Y([-+]?\d+)/)

      if (xm || ym) {
        if (!fs) {
          warn('coordinate before FS — using default 3.6 format')
          fs = { zero: 'L', notation: 'A', xInt: 3, xDec: 6, yInt: 3, yDec: 6 }
        }
        if (xm) x = parseCoord(xm[1], fs.xInt, fs.xDec, fs.zero) * scale
        if (ym) y = parseCoord(ym[1], fs.yInt, fs.yDec, fs.zero) * scale
      }

      const effectiveOp = opCode === 'D01' || opCode === 'D02' || opCode === 'D03' ? opCode : interpolation === 'D01' && (xm || ym) ? 'D01' : opCode

      if (effectiveOp === 'D01') {
        if (inRegion) {
          contour.push([x, y])
        } else {
          if (!stroke) stroke = { pts: [], width: current ? current.w : 0.2 }
          stroke.pts.push([x, y])
        }
      } else if (effectiveOp === 'D02') {
        if (inRegion) endContour()
        else endStroke()
      } else if (effectiveOp === 'D03') {
        if (inRegion) warn('flash inside region — ignored')
        else if (current) {
          out.flashes.push({
            shape: current.shape === 'poly' ? 'circle' : current.shape,
            x,
            y,
            w: current.w,
            h: current.h,
            hole: current.hole,
          })
        }
      }
    }

    if (line.startsWith('M02') || line.startsWith('M30')) break
  }

  endStroke()
  if (inRegion) endContour()
  void unitSet

  return out
}
