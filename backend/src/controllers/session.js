import {cookieOptions,login,logout,sessionToken} from '../services/auth.js';

export function session(db) {
  return {
    login(req,res) {
      const result=login(db,req.body??{});
      logout(db,sessionToken(req));
      res.cookie('inventario',result.token,cookieOptions).json(result.user);
    },
    current(req,res) {
      res.json(req.user);
    },
    logout(req,res) {
      logout(db,sessionToken(req));
      res.clearCookie('inventario',{httpOnly:true,sameSite:'strict',path:'/'}).json({ok:true});
    }
  };
}