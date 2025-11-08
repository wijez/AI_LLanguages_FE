import React from 'react'
import './App.css'
import './index.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { 
  PracticePage, LearnPage, RankPage, InfoPage, 
  MorePage, SpeechPage, TaskPage, ShopPage,
  LandingPage, SignupPage,LoginPage
} from './lazy'
import AppAdmin from './admin/AppAdmin.jsx'
import  AppProviders  from './AppProviders.jsx'
import LessonSession from './components/Sessions/LessonSession.jsx'
import RegisterAccountPage from './user/pages/RegisterAccountPage.jsx';
import VerifyCodePage from './user/pages/VerifyCodePage.jsx';
import { Toaster } from 'react-hot-toast';


function App() {
  return (
    <AppProviders>
      <Toaster position="top-center" reverseOrder={false} />
    <BrowserRouter>
      <Routes>
        <Route path="/learn/session/:id" element={<LessonSession />} />
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
        <Route path="/signup" element={ <RegisterAccountPage />} />
        <Route path="/verify" element={ <VerifyCodePage />} />
      </Routes>
    </BrowserRouter>
    </AppProviders>
  )
}

export default App