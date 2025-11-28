export function filtrarPublicacoes(publicacoes = [], keywords = [], value = '') {
    return publicacoes.filter(pub => {
        return pub.destinatarios.some(dest => {

            const nome = normalize(dest.nome);
            const input = normalize(value)

            if(!nome.includes(input)) {
                return false;
            }

            return keywords.some(keyword => nome.includes(keyword));
        })
    })
}

export function normalize(value = '') {
    return value.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace('-', ' ');
}