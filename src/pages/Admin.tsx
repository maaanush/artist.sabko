import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function Admin() {
  const navigate = useNavigate()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'products'>('users')
  const [products, setProducts] = useState<Array<{ id: string, name: string, base_price: number }>>([])
  const [productsLoading, setProductsLoading] = useState<boolean>(false)
  const [productsMsg, setProductsMsg] = useState<string | null>(null)
  const [showAddProduct, setShowAddProduct] = useState<boolean>(false)
  const [newProdName, setNewProdName] = useState<string>('')
  const [newProdPrice, setNewProdPrice] = useState<string>('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) {
        navigate('/login', { replace: true })
        return
      }
      const role = (user.app_metadata as any)?.role || (user.user_metadata as any)?.role
      if (role !== 'admin') {
        navigate('/dashboard', { replace: true })
        return
      }
      setAuthorized(true)
    })
  }, [navigate])

  useEffect(() => {
    if (!authorized) return
    if (activeTab !== 'products') return
    void fetchProducts()
  }, [authorized, activeTab])

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  async function sendInvite(e: FormEvent) {
    e.preventDefault()
    setInviteMsg(null)
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) {
      setInviteMsg('Not authenticated')
      return
    }
    try {
      const resp = await fetch('https://iadikxulenwatjizhthr.functions.supabase.co/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: inviteEmail }),
      })
      if (!resp.ok) {
        let msg = 'Failed'
        try {
          const txt = await resp.text()
          msg = txt || msg
        } catch {}
        setInviteMsg(msg)
      } else {
        setInviteMsg('Invite sent')
        setInviteEmail('')
      }
    } catch (err) {
      setInviteMsg('Network error')
    }
  }

  async function fetchProducts() {
    setProductsLoading(true)
    setProductsMsg(null)
    const { data, error } = await supabase
      .from('products')
      .select('id, name, base_price')
      .order('name', { ascending: true })
    if (error) {
      setProductsMsg('Failed to load products')
    } else {
      setProducts(data as any)
    }
    setProductsLoading(false)
  }

  async function saveNewProduct(e: FormEvent) {
    e.preventDefault()
    setProductsMsg(null)
    const name = newProdName.trim()
    const price = parseFloat(newProdPrice)
    if (!name || isNaN(price) || price < 0) {
      setProductsMsg('Enter valid name and non-negative base price')
      return
    }
    const { error } = await supabase
      .from('products')
      .insert({ name, base_price: price })
    if (error) {
      setProductsMsg('Failed to add product')
      return
    }
    setShowAddProduct(false)
    setNewProdName('')
    setNewProdPrice('')
    await fetchProducts()
  }

  if (!authorized) {
    return null
  }

  return (
    <div style={{ maxWidth: 640, margin: '64px auto', padding: 24 }}>
      <h1 className="text-2xl font-semibold">Admin</h1>

      <div className="mt-6 border-b">
        <nav className="-mb-px flex gap-4" aria-label="Tabs">
          <button
            className={activeTab === 'users' ? 'border-b-2 border-primary text-primary px-1 py-2' : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground px-1 py-2'}
            onClick={() => setActiveTab('users')}
            type="button"
          >
            Users
          </button>
          <button
            className={activeTab === 'products' ? 'border-b-2 border-primary text-primary px-1 py-2' : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground px-1 py-2'}
            onClick={() => setActiveTab('products')}
            type="button"
          >
            Products
          </button>
        </nav>
      </div>

      {activeTab === 'users' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Invite a user</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendInvite} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email</Label>
                <Input id="inviteEmail" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
              </div>
              <Button type="submit">Send invite</Button>
              {inviteMsg && <p className="text-sm text-muted-foreground">{inviteMsg}</p>}
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'products' && (
        <>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div />
                <Button onClick={() => setShowAddProduct(true)}>Add product</Button>
              </div>
              {productsLoading && <p className="text-sm">Loading…</p>}
              {!productsLoading && products.length === 0 && (
                <p className="text-sm text-muted-foreground">No products yet. Click “Add product”.</p>
              )}
              {!productsLoading && products.length > 0 && (
                <div className="space-y-2">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-muted-foreground">Base price: ₹{Number(p.base_price).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {productsMsg && <p className="mt-3 text-sm text-destructive">{productsMsg}</p>}
            </CardContent>
          </Card>

          {showAddProduct && (
            <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddProduct(false)} />
              <div className="relative z-10 w-full flex justify-center px-2">
                <Card className="w-[98%] max-w-[460px] flex flex-col overflow-hidden">
                  <CardHeader>
                    <CardTitle>Add product</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={saveNewProduct} className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="prod_name">Product name</Label>
                        <Input id="prod_name" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="prod_price">Base price</Label>
                        <Input id="prod_price" type="number" inputMode="decimal" step="0.01" min="0" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} required />
                      </div>
                      {productsMsg && <p className="text-sm text-destructive">{productsMsg}</p>}
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setShowAddProduct(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter />
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      <button className="mt-6" onClick={signOut}>Sign out</button>
    </div>
  )
}


