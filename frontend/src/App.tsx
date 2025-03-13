import { LoginForm } from "./components/login-form"
import { Button } from "./components/ui/button"
import { useUserStore } from "./stores/useUserStore"

function App() {
  const { isAuthenticated, logout } = useUserStore()

  return (
    <div className="min-h-screen  flex items-center justify-center dark bg-background ">
      {
        isAuthenticated() ? (
          <>
            <h1 className="text-red-500 text-4xl">Voce esta logado</h1>
            <Button onClick={() => logout()}>Logout</Button>
          </>
        ) : (
          <LoginForm />)
      }

    </div>
  )
}

export default App
