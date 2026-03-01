'use client'

import Script from 'next/script'

export default function GoogleReviews() {
  return (
    <>
      <Script src="https://elfsightcdn.com/platform.js" strategy="lazyOnload" />
      <div
        className="elfsight-app-caedbc9e-d6e9-4aa0-9d7b-876d7114165b"
        data-elfsight-app-lazy
      />
    </>
  )
}
