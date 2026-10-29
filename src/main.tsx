import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'
import './styles/section-home.css'
import './styles/section-timeline.css'
import './styles/section-projects.css'

createRoot(document.getElementById('root')!).render(<App />)
