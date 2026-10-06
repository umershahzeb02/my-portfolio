import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import Page from './Page.jsx'
import './index.css'

// Every page arrives rendered; this attaches React to what is already there.
const data = JSON.parse(document.getElementById('page-data').textContent)

hydrateRoot(
  document.getElementById('root'),
  <StrictMode>
    <Page data={data} />
  </StrictMode>,
)
