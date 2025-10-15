import React from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { 
  PracticePage, LearnPage, RankPage, InfoPage, 
  MorePage, SpeechPage, TaskPage, ShopPage
} from './lazy'
import AppAdmin from './admin/AppAdmin.jsx'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/speech" element={<SpeechPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/rank" element={<RankPage />} />
        <Route path="/task" element={<TaskPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/profile" element={<InfoPage />} />
        <Route path='/more' element={<MorePage />} />
         <Route path="/admin/*" element={<AppAdmin/>} />

      </Routes>
    </BrowserRouter>
  )
}

export default App