import React from 'react'
import { MainLayout , Friend} from '../../lazy'

export default function FriendPage() {
  return (
    <MainLayout containerClassName="w-full px-0 py-0 flex justify-center" >
      <Friend/>
    </MainLayout>
  )
}