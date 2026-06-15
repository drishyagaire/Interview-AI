import React,{useState} from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ error, setError ] = useState("")
    const [ isLoggingIn, setIsLoggingIn ] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setIsLoggingIn(true)
        try {
            const success = await handleLogin({email,password})
            if (success) {
                navigate('/')
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please check your credentials.")
        } finally {
            setIsLoggingIn(false)
        }
    }

    if(loading){
        return (<main><h1>Loading.......</h1></main>)
    }


    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>
                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Enter email address' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password' />
                    </div>
                    <button className='button primary-button' disabled={isLoggingIn} style={{ opacity: isLoggingIn ? 0.6 : 1 }}>
                        {isLoggingIn ? "Logging in..." : "Login"}
                    </button>
                </form>
                <p>Don't have an account? <Link to={"/register"} >Register</Link> </p>
            </div>
        </main>
    )
}

export default Login