import abraCadaBra from './src/js/abra-cada-bra';

const constructAll = function() {
abraCadaBra.init();
document.removeEventListener('o.DOMContentLoaded', constructAll);
};

document.addEventListener('o.DOMContentLoaded', constructAll);

export default abraCadaBra;