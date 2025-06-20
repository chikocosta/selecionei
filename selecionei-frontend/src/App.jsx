import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Upload, FileText, Search, Star, TrendingUp, Users, Clock, CheckCircle, X, Phone, Mail, Award, LogIn, UserPlus, CreditCard, BarChart3, Settings, LogOut, Menu, ChevronDown, AlertCircle, Loader2 } from 'lucide-react'
import selecioneiLogo from './assets/selecionei-logo.png'
import './App.css'

// Configuração da API
const API_BASE_URL = 'http://localhost:5001/api'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [user, setUser] = useState(null)
  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [analysisCount, setAnalysisCount] = useState(4247)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [userAnalyses, setUserAnalyses] = useState([])
  const [plans, setPlans] = useState({})

  // Carregar dados do usuário do localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('selecionei_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setCurrentPage('dashboard')
    }
  }, [])

  // Salvar usuário no localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('selecionei_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('selecionei_user')
    }
  }, [user])

  // Carregar planos
  useEffect(() => {
    fetchPlans()
  }, [])

  // Contador de análises em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalysisCount(prev => prev + Math.floor(Math.random() * 3))
    }, 45000)
    return () => clearInterval(interval)
  }, [])

  // Pop-up de captura de email
  useEffect(() => {
    if (currentPage === 'home' && !user) {
      const timer = setTimeout(() => {
        if (!showSuccess && !analysis) {
          setShowPopup(true)
        }
      }, 25000)
      return () => clearTimeout(timer)
    }
  }, [currentPage, user, showSuccess, analysis])

  // Funções da API
  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/plans`)
      const data = await response.json()
      if (data.success) {
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setUser(data.user)
        setCurrentPage('dashboard')
        setEmail('')
        setPassword('')
      } else {
        setError(data.error || 'Erro no login')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, company }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setUser(data.user)
        setCurrentPage('dashboard')
        setName('')
        setEmail('')
        setPassword('')
        setCompany('')
      } else {
        setError(data.error || 'Erro no registro')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentPage('home')
    setAnalysis(null)
    setFile(null)
    setJobDescription('')
    setUserAnalyses([])
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (allowedTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.txt')) {
        setFile(selectedFile)
        setError('')
      } else {
        setError('Tipo de arquivo não suportado. Use PDF, TXT, DOC ou DOCX.')
        setFile(null)
      }
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Por favor, selecione um arquivo de currículo')
      return
    }

    if (user && user.analyses_used >= user.analyses_limit) {
      setError('Limite de análises atingido. Faça upgrade do seu plano!')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('job_description', jobDescription)
      if (user) {
        formData.append('user_id', user.id.toString())
      }

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setAnalysis(data.analysis)
        setAnalysisCount(prev => prev + 1)
        setShowSuccess(true)
        
        // Atualizar dados do usuário se logado
        if (user) {
          setUser(prev => ({
            ...prev,
            analyses_used: prev.analyses_used + 1
          }))
          // Recarregar análises do usuário
          loadUserAnalyses()
        }

        setTimeout(() => {
          document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth' })
        }, 500)
      } else {
        setError(data.error || 'Erro na análise')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const loadUserAnalyses = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/${user.id}/analyses`)
      const data = await response.json()
      
      if (data.success) {
        setUserAnalyses(data.analyses)
      }
    } catch (error) {
      console.error('Erro ao carregar análises:', error)
    }
  }

  const createPayment = async (plan) => {
    if (!user) {
      setError('Faça login para continuar')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          plan: plan,
          base_url: window.location.origin
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirecionar para o Mercado Pago
        window.open(data.payment_url, '_blank')
      } else {
        setError(data.error || 'Erro ao criar pagamento')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
    }
  }

  const resetAnalysis = () => {
    setFile(null)
    setJobDescription('')
    setAnalysis(null)
    setError('')
    setShowSuccess(false)
  }

  const handleEmailSubmit = (e) => {
    e.preventDefault()
    setShowPopup(false)
    setEmail('')
    alert('Obrigado! Crie sua conta para ganhar 5 análises grátis! 🎉')
    setCurrentPage('register')
  }

  // Carregar análises do usuário quando fizer login
  useEffect(() => {
    if (user && currentPage === 'dashboard') {
      loadUserAnalyses()
    }
  }, [user, currentPage])

  // Componente Header
  const Header = () => (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage('home')}>
            <img src={selecioneiLogo} alt="Selecionei" className="h-10 w-auto mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Selecionei</h1>
              <p className="text-sm text-gray-600">Seleção Inteligente</p>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {!user ? (
              <>
                <Button variant="ghost" onClick={() => setCurrentPage('login')}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
                <Button onClick={() => setCurrentPage('register')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Conta
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setCurrentPage('dashboard')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => setCurrentPage('analyze')}>
                  <Search className="h-4 w-4 mr-2" />
                  Analisar
                </Button>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Olá, {user.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {user.plan.toUpperCase()}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            {!user ? (
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => {setCurrentPage('login'); setShowMobileMenu(false)}}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
                <Button className="w-full" onClick={() => {setCurrentPage('register'); setShowMobileMenu(false)}}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Conta
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => {setCurrentPage('dashboard'); setShowMobileMenu(false)}}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => {setCurrentPage('analyze'); setShowMobileMenu(false)}}>
                  <Search className="h-4 w-4 mr-2" />
                  Analisar
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )

  // Página Home
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Pop-up de Captura de Email */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl max-w-md w-full mx-4 relative shadow-2xl">
            <button 
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                🎁 Ganhe 5 Análises Grátis!
              </h3>
              <p className="text-gray-600">
                Teste a Selecionei gratuitamente e veja como economizar 90% do tempo de RH
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Seu melhor email profissional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Quero Meu Teste Grátis! 🚀
              </Button>
            </form>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              ✅ Sem spam ✅ Cancele quando quiser ✅ Suporte em português
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Encontre o Candidato Ideal<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              em 30 Segundos
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Plataforma inteligente que analisa currículos automaticamente e encontra os melhores talentos para sua empresa. 
            <strong> Economize 90% do tempo de RH.</strong>
          </p>
          
          {/* Prova Social */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
            <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-semibold text-gray-700">
                {analysisCount.toLocaleString()} análises realizadas
              </span>
            </div>
            <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-lg">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-sm font-semibold text-gray-700">
                4.9/5 satisfação
              </span>
            </div>
            <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-lg">
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-semibold text-gray-700">
                90% menos tempo
              </span>
            </div>
          </div>

          {/* CTA Principal */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-8 rounded-2xl mb-12 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <Award className="h-8 w-8 mr-3" />
              <span className="text-2xl font-bold">🎯 TESTE GRÁTIS - 5 Análises Gratuitas</span>
            </div>
            <p className="text-xl mb-4">Resultado em 30 segundos • Sem cartão de crédito</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
                onClick={() => setCurrentPage('register')}
              >
                Começar Agora - É Grátis! 🚀
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg"
                onClick={() => setCurrentPage('analyze')}
              >
                Ver Demonstração
              </Button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{analysisCount.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Currículos Analisados</div>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Clock className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">90%</div>
              <div className="text-sm text-gray-600">Redução de Tempo</div>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Star className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">4.9/5</div>
              <div className="text-sm text-gray-600">Satisfação Clientes</div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">1.247</div>
              <div className="text-sm text-gray-600">Empresas Ativas</div>
            </CardContent>
          </Card>
        </div>

        {/* Demonstração */}
        <Card className="mb-12">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Teste Grátis - Análise de Currículo
            </CardTitle>
            <CardDescription className="text-lg">
              Faça upload de um currículo e veja a análise completa em 30 segundos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Upload className="h-6 w-6 mr-2 text-blue-600" />
                    Faça upload de um currículo
                  </h3>
                  <p className="text-gray-600 mb-4">Veja a análise inteligente em ação!</p>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.txt,.doc,.docx"
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        {file ? file.name : 'Clique para selecionar arquivo'}
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF, TXT, DOC ou DOCX (máx. 10MB)
                      </p>
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="job-description" className="text-lg font-medium">
                    Descrição da Vaga (Opcional)
                  </Label>
                  <Textarea
                    id="job-description"
                    placeholder="Cole aqui a descrição da vaga para análise de compatibilidade..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="mt-2 min-h-[120px]"
                  />
                </div>

                {error && (
                  <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-700">{error}</span>
                  </div>
                )}

                <Button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Analisar Currículo
                    </>
                  )}
                </Button>
              </div>

              {/* Preview Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Resultado da Análise
                </h3>
                <p className="text-gray-600 mb-6">
                  Análise detalhada e inteligente do candidato
                </p>
                
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Experiência:</span>
                      <span className="font-semibold text-blue-600">5 anos</span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Nível:</span>
                      <span className="font-semibold text-green-600">Pleno</span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Compatibilidade:</span>
                      <span className="font-semibold text-purple-600">92%</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Prévia do que você receberá
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado da Análise */}
        {analysis && (
          <div id="resultado" className="mb-12">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-green-800">
                  ✅ Análise Concluída com Sucesso!
                </CardTitle>
                <CardDescription className="text-green-700">
                  Resultado processado em {analysis.processing_time || 2}s pela nossa IA
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {analysis.pontuacao_geral}
                    </div>
                    <div className="text-sm text-gray-600">Pontuação Geral</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {analysis.experiencia_anos}
                    </div>
                    <div className="text-sm text-gray-600">Anos de Experiência</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-lg font-bold text-purple-600 mb-2">
                      {analysis.nivel_senioridade}
                    </div>
                    <div className="text-sm text-gray-600">Nível</div>
                  </div>
                  
                  {analysis.compatibilidade_vaga && (
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {analysis.compatibilidade_vaga}%
                      </div>
                      <div className="text-sm text-gray-600">Compatibilidade</div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-gray-900">
                      💪 Pontos Fortes
                    </h4>
                    <ul className="space-y-2">
                      {analysis.pontos_fortes.map((ponto, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{ponto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-gray-900">
                      🛠️ Skills Técnicas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills_tecnicas.map((skill, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4 text-gray-900">
                    💬 Resumo Executivo
                  </h4>
                  <p className="text-gray-700 bg-white p-4 rounded-lg border">
                    {analysis.resumo}
                  </p>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4 text-gray-900">
                    ❓ Perguntas para Entrevista
                  </h4>
                  <ul className="space-y-3">
                    {analysis.perguntas_entrevista.map((pergunta, index) => (
                      <li key={index} className="flex items-start bg-white p-4 rounded-lg border">
                        <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{pergunta}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 text-center">
                  <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold">
                    <Award className="h-5 w-5 mr-2" />
                    {analysis.recomendacao}
                  </div>
                </div>

                <div className="mt-8 text-center space-x-4">
                  <Button onClick={resetAnalysis} variant="outline">
                    Nova Análise
                  </Button>
                  {!user && (
                    <Button onClick={() => setCurrentPage('register')} className="bg-gradient-to-r from-blue-600 to-purple-600">
                      Criar Conta Grátis
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Planos */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Planos que cabem no seu bolso
            </h3>
            <p className="text-lg text-gray-600">
              Escolha o plano ideal para sua empresa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(plans).map(([planKey, plan]) => (
              <Card key={planKey} className={`relative ${planKey === 'professional' ? 'border-blue-500 shadow-lg scale-105' : ''}`}>
                {planKey === 'professional' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      MAIS POPULAR
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-blue-600 my-4">
                    R$ {plan.price.toFixed(0)}<span className="text-lg text-gray-500">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.description.split(' + ').map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6"
                    variant={planKey === 'professional' ? 'default' : 'outline'}
                    onClick={() => createPayment(planKey)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Escolher Plano
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Depoimentos */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">
            O que nossos clientes dizem
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "Reduziu nosso tempo de triagem de 8 horas para 30 minutos. Nossa produtividade aumentou 300%!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    M
                  </div>
                  <div>
                    <div className="font-semibold">Maria Silva</div>
                    <div className="text-sm text-gray-600">Gerente de RH, TechCorp</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "A qualidade das contratações melhorou 70%. Encontramos talentos que passariam despercebidos!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    J
                  </div>
                  <div>
                    <div className="font-semibold">João Santos</div>
                    <div className="text-sm text-gray-600">CEO, StartupXYZ</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "Interface simples e resultados precisos. ROI de 500% no primeiro mês!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    A
                  </div>
                  <div>
                    <div className="font-semibold">Ana Costa</div>
                    <div className="text-sm text-gray-600">Diretora, InnovaCorp</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white p-12 rounded-2xl">
          <h3 className="text-3xl font-bold mb-4">
            Pronto para Revolucionar seu RH?
          </h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Junte-se a <strong>{analysisCount.toLocaleString()} empresas</strong> que já economizam 15 horas por semana 
            e encontram os melhores talentos em segundos
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <Button 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
              onClick={() => setCurrentPage('register')}
            >
              Começar Gratuitamente
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg"
              onClick={() => setCurrentPage('analyze')}
            >
              Testar Agora
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Sem cartão de crédito
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              5 análises grátis
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Suporte em português
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src={selecioneiLogo} alt="Selecionei" className="h-8 w-auto mr-3" />
                <div>
                  <h4 className="text-xl font-bold">Selecionei</h4>
                  <p className="text-sm text-gray-400">Seleção Inteligente de Talentos</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Revolucionando o recrutamento com tecnologia inteligente
              </p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">contato@selecionei.com.br</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span className="text-sm">WhatsApp: (11) 99999-9999</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Produto</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-white">Preços</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Integrações</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Empresa</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Sobre</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Carreiras</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Suporte</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">Documentação</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white">Política de Privacidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Selecionei. Todos os direitos reservados. CNPJ: 00.000.000/0001-00</p>
          </div>
        </div>
      </footer>
    </div>
  )

  // Página de Login
  const LoginPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src={selecioneiLogo} alt="Selecionei" className="h-12 w-auto mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Selecionei</h1>
              <p className="text-sm text-gray-600">Seleção Inteligente</p>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Fazer Login</CardTitle>
          <CardDescription>
            Entre na sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <button 
                onClick={() => setCurrentPage('register')}
                className="text-blue-600 hover:underline font-medium"
              >
                Criar conta grátis
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Página de Registro
  const RegisterPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src={selecioneiLogo} alt="Selecionei" className="h-12 w-auto mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Selecionei</h1>
              <p className="text-sm text-gray-600">Seleção Inteligente</p>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Criar conta grátis</CardTitle>
          <CardDescription>
            Comece com 5 análises gratuitas, sem cartão de crédito
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                type="text"
                placeholder="Nome da sua empresa"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar conta grátis
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-700 text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              5 análises grátis • Sem cartão • Cancele quando quiser
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <button 
                onClick={() => setCurrentPage('login')}
                className="text-blue-600 hover:underline font-medium"
              >
                Fazer login
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Página de Análise
  const AnalyzePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Análise Inteligente de Currículos
          </h2>
          <p className="text-lg text-gray-600">
            Faça upload de um currículo e receba análise completa em 30 segundos
          </p>
          {user && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              {user.analyses_used}/{user.analyses_limit} análises utilizadas
            </div>
          )}
        </div>

        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <Label htmlFor="file-upload" className="text-lg font-medium">
                  Upload do Currículo
                </Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.doc,.docx"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      {file ? file.name : 'Clique para selecionar arquivo'}
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, TXT, DOC ou DOCX (máx. 10MB)
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="job-description" className="text-lg font-medium">
                  Descrição da Vaga (Opcional)
                </Label>
                <Textarea
                  id="job-description"
                  placeholder="Cole aqui a descrição da vaga para análise de compatibilidade..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="mt-2 min-h-[120px]"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Adicione a descrição da vaga para receber análise de compatibilidade
                </p>
              </div>

              {error && (
                <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Analisar Currículo
                    </>
                  )}
                </Button>
                
                {(file || jobDescription || analysis) && (
                  <Button onClick={resetAnalysis} variant="outline">
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado da Análise */}
        {analysis && (
          <div id="resultado">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-green-800">
                  ✅ Análise Concluída com Sucesso!
                </CardTitle>
                <CardDescription className="text-green-700">
                  Resultado processado em {analysis.processing_time || 2}s pela nossa IA
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {analysis.pontuacao_geral}
                    </div>
                    <div className="text-sm text-gray-600">Pontuação Geral</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {analysis.experiencia_anos}
                    </div>
                    <div className="text-sm text-gray-600">Anos de Experiência</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-lg font-bold text-purple-600 mb-2">
                      {analysis.nivel_senioridade}
                    </div>
                    <div className="text-sm text-gray-600">Nível</div>
                  </div>
                  
                  {analysis.compatibilidade_vaga && (
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {analysis.compatibilidade_vaga}%
                      </div>
                      <div className="text-sm text-gray-600">Compatibilidade</div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-gray-900">
                      💪 Pontos Fortes
                    </h4>
                    <ul className="space-y-2">
                      {analysis.pontos_fortes.map((ponto, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{ponto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-gray-900">
                      🛠️ Skills Técnicas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills_tecnicas.map((skill, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4 text-gray-900">
                    💬 Resumo Executivo
                  </h4>
                  <p className="text-gray-700 bg-white p-4 rounded-lg border">
                    {analysis.resumo}
                  </p>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4 text-gray-900">
                    ❓ Perguntas para Entrevista
                  </h4>
                  <ul className="space-y-3">
                    {analysis.perguntas_entrevista.map((pergunta, index) => (
                      <li key={index} className="flex items-start bg-white p-4 rounded-lg border">
                        <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{pergunta}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 text-center">
                  <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold">
                    <Award className="h-5 w-5 mr-2" />
                    {analysis.recomendacao}
                  </div>
                </div>

                <div className="mt-8 text-center space-x-4">
                  <Button onClick={resetAnalysis} variant="outline">
                    Nova Análise
                  </Button>
                  {!user && (
                    <Button onClick={() => setCurrentPage('register')} className="bg-gradient-to-r from-blue-600 to-purple-600">
                      Criar Conta Grátis
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )

  // Página Dashboard
  const DashboardPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h2>
          <p className="text-gray-600">
            Bem-vindo de volta, {user?.name}!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Plano Atual</p>
                  <p className="text-2xl font-bold text-blue-600 capitalize">
                    {user?.plan}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Análises Usadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {user?.analyses_used}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Limite do Plano</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {user?.analyses_limit === 999999 ? '∞' : user?.analyses_limit}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Restantes</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {user?.analyses_limit === 999999 ? '∞' : (user?.analyses_limit - user?.analyses_used)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Análises Recentes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Análises Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userAnalyses.length > 0 ? (
                  <div className="space-y-4">
                    {userAnalyses.slice(0, 5).map((analysis) => (
                      <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {analysis.filename}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Pontuação: {analysis.score} • {analysis.seniority_level}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            analysis.score >= 85 ? 'bg-green-100 text-green-800' :
                            analysis.score >= 75 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {analysis.recommendation}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma análise realizada ainda</p>
                    <Button 
                      onClick={() => setCurrentPage('analyze')}
                      className="mt-4"
                    >
                      Fazer Primeira Análise
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ações Rápidas */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => setCurrentPage('analyze')}
                  className="w-full"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Nova Análise
                </Button>
                
                {user?.plan === 'free' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Upgrade seu Plano
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Desbloqueie mais análises e recursos avançados
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => createPayment('starter')}
                    >
                      Ver Planos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progresso do Plano */}
            <Card>
              <CardHeader>
                <CardTitle>Uso do Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Análises utilizadas</span>
                      <span>{user?.analyses_used}/{user?.analyses_limit === 999999 ? '∞' : user?.analyses_limit}</span>
                    </div>
                    {user?.analyses_limit !== 999999 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(user?.analyses_used / user?.analyses_limit) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  
                  {user?.analyses_used >= user?.analyses_limit && user?.plan !== 'enterprise' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        Limite atingido! Faça upgrade para continuar analisando.
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => createPayment('professional')}
                      >
                        Fazer Upgrade
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="App">
      <Header />
      
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'register' && <RegisterPage />}
      {currentPage === 'analyze' && <AnalyzePage />}
      {currentPage === 'dashboard' && user && <DashboardPage />}
    </div>
  )
}

export default App

