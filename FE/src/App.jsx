import React from 'react'
import './App.css'
import './index.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { 
  PracticePage, LearnPage, RankPage, InfoPage, 
  MorePage, SpeechPage, TaskPage, ShopPage,
  LandingPage
} from './lazy'
import AppAdmin from './admin/AppAdmin.jsx'
import  AppProviders  from './AppProviders.jsx'
import SignupPage from './pages/SignUpPage.jsx'
import LoginPage from './pages/LoginPage.jsx'


function App() {
  return (
    <AppProviders>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/speech" element={<SpeechPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/rank" element={<RankPage />} />
        <Route path="/task" element={<TaskPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/profile" element={<InfoPage />} />
        <Route path='/more' element={<MorePage />} />
        <Route path="/admin/*" element={<AppAdmin/>} />
        <Route path="/register/" element={<SignupPage/>} />
        <Route path="/login/" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
    </AppProviders>
  )
}

export default App