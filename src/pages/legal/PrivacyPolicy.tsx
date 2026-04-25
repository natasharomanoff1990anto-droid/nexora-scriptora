import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black text-zinc-400 p-10 font-sans flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full border border-zinc-800 p-8 bg-zinc-950">
        <h1 className="text-white text-3xl font-black mb-6 uppercase tracking-tighter">Privacy Protocol</h1>
        <div className="space-y-4 text-sm leading-relaxed">
          <p>L'autenticazione tramite Google è utilizzata esclusivamente per l'accesso sicuro dell'autore.</p>
          <p>Tutti i manoscritti generati rimangono proprietà intellettuale dell'utente.</p>
          <p>I dati di sessione sono gestiti tramite cifratura Supabase Standard Platino.</p>
        </div>
        <a href="/" className="mt-10 inline-block text-white border border-white px-4 py-2 hover:bg-white hover:text-black transition-all uppercase font-bold text-xs">
          ← Ritorna alla Plancia
        </a>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
