"use client";

import React, { useEffect, useState } from 'react'

function Page() {

  const [message, setMessage] = useState("Loading")

  useEffect(() => {
    fetch("http://localhost:8080/api/home").then(
      response => response.json()
    ).then(
      data => {
        console.log(data)
        setMessage(data.message)
      }
    )
  }, []);

  return (
    <div>{message}</div>
  )
}

export default Page