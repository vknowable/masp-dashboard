// import './App.css'
// import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Footer from './components/Footer'
import MainContent from './components/MainContent'
// import init, { Query } from "masp_dashboard_wasm"
import { useEffect } from "react"
import init from "masp_dashboard_wasm"

function App() {

  useEffect(() => {
    (async () => {
      // Initialize the WASM module
      await init()
    })()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">

      {/* Sidebar */}
      {/* <aside className="w-64 bg-white shadow-lg">
        <Sidebar />
      </aside> */}

      <header className="bg-white shadow-md px-4 py-2">
        <Header />
      </header>

      <main className="flex-1 p-4 bg-gray-100">
        <MainContent />
      </main>

      <footer className="bg-white shadow-md p-2 text-center">
        <Footer />
      </footer>

    </div>
  )
}


export default App
