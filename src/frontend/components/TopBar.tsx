import logo from '@public/logo.svg'
import ColumnSelector from './ColumnSelector'

export default function TopBar() {
  return (
    <div className='absolute top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b bg-background/50 px-4 backdrop-blur-lg'>
      <div className='flex items-center gap-2'>
        <img src={logo} alt='syslogger logo' className='h-6 w-6' />
        <h1 className='text-lg font-black'>syslogger</h1>
      </div>
      <ColumnSelector />
    </div>
  )
}
