const divDebug = document.querySelector('#debug'),
    debug = (text) => {
        divDebug.innerHTML += text+'<br/>';
    };

debug('Loading kernel')

fetch('images/intbb/kernel')
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => {
        debug('Loaded kernel, starting CPU');
        cpu = new CPU();
        debug('Started CPU, running kernel')
        cpu.runProgram(arrayBuffer);
    }).catch((err) => console.log(err));
