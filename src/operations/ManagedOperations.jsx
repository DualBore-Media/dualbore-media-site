import {ClerkProvider,SignIn,UserButton,useAuth,useUser,useReverification} from '@clerk/react';
import OperationsApp from './OperationsApp.jsx';

function Connected({admin}){
 const {isLoaded,isSignedIn,getToken,signOut}=useAuth();const {user}=useUser();
 const fetcher=useReverification(async(url,options)=>fetch(url,{...options,headers:{...options.headers,Authorization:`Bearer ${await getToken({skipCache:true})}`}}));
 return <OperationsApp admin={admin} auth={{isLoaded,isSignedIn,getToken,user,signOut,fetcher,
   signInElement:<SignIn routing="hash" fallbackRedirectUrl={admin?'/admin':'/account'}/>,
   accountElement:<UserButton/>}}/>;
}
export default function ManagedOperations({admin=false}){
 const key=import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
 if(!key)return <OperationsApp admin={admin} auth={{isLoaded:true,isSignedIn:false,signInElement:<p role="status">Secure sign-in is not configured yet. Accounts will open after the managed provider is connected.</p>}}/>;
 return <ClerkProvider publishableKey={key} telemetry={{disabled:true}} appearance={{variables:{colorPrimary:'#ff2a3b',colorBackground:'#13161c',colorText:'#f5f7fb',colorTextSecondary:'#b8c1ce',colorInputBackground:'#0b0d10',colorInputText:'#f5f7fb',borderRadius:'4px'}}}><Connected admin={admin}/></ClerkProvider>;
}
