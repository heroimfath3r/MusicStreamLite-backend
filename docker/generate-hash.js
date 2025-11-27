const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'test123';
    const saltRounds = 12;
    
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Hash generado para test123:');
    console.log(hash);
    
    // Verificar que funciona
    const isValid = await bcrypt.compare('test123', hash);
    console.log('\nVerificación:', isValid ? '? CORRECTO' : '? ERROR');
}

generateHash();
