import { Auth0Client } from '@auth0/nextjs-auth0/server'
import { syncUser } from './user-sync'

export const auth0 = new Auth0Client({
  beforeSessionSaved: syncUser,
})
