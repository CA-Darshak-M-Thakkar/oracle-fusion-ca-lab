import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { EbsReplicaGallery } from './components/ebs/replica/EbsReplicaGallery.tsx';
import './index.css';

/** #ebs-replica opens the EBS R12 / Fusion screen gallery (static, no student data); everything else is the normal lab. */
function Root() {
  const [replica, setReplica] = useState(window.location.hash.startsWith('#ebs-replica'));
  useEffect(() => {
    const f = () => setReplica(window.location.hash.startsWith('#ebs-replica'));
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return replica ? <EbsReplicaGallery /> : <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
