import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;

export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        throw new Error('Invalid token');
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Error verifying Supabase token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
