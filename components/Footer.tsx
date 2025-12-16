import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 mt-auto text-center text-gray-400 text-sm">
      <p className="mb-2">
        Ferramenta gratuita para desenvolvedores e criadores.
      </p>
      <p className="text-xs opacity-60 max-w-md mx-auto">
        Este site não é afiliado ao Pinterest. Todos os logotipos e marcas registradas são propriedade de seus respectivos donos.
        Use com responsabilidade.
      </p>
    </footer>
  );
};

export default Footer;