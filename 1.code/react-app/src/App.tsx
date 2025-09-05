import { useQuery } from '@tanstack/react-query'
import { useCounterStore } from './store'

function App() {
  const { count, increment, decrement } = useCounterStore()
  
  const { data, isLoading } = useQuery({
    queryKey: ['example'],
    queryFn: () => Promise.resolve('React Query is working!')
  })

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Vite + React + TypeScript
        </h1>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg mb-4">Count: {count}</p>
            <div className="space-x-2">
              <button 
                onClick={increment}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                +
              </button>
              <button 
                onClick={decrement}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                -
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {isLoading ? 'Loading...' : data}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
