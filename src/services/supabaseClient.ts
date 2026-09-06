import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

import type { Database } from '../types/database.types'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../utils/constants'

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
