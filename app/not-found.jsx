import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className='flex flex-col justify-center items-center h-screen'>
        <h1 className='text-6xl font-bold gradient-title mb-4 '>404</h1>
      <h2 className='text-2xl font-semibold mb-4'>Page not Found</h2>
      <Link href="/">Return Home</Link>
    </div>
  )
} 