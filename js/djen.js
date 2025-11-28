import axios from 'https://cdn.jsdelivr.net/npm/axios@1.13.2/+esm'

const djen = {

    baseUrl: 'https://comunicaapi.pje.jus.br/api/v1',

    async publicacoes({ nomeParte, dataDisponibilizacaoInicio, dataDisponibilizacaoFim } = {}) {

        const limite = 100;
        let pagina = 1;
        let items = [];
        let publicacoes = []

        do {
            let response = await axios.get(`${this.baseUrl}/comunicacao`, {
                params: {
                    nomeParte: nomeParte,
                    dataDisponibilizacaoInicio: dataDisponibilizacaoInicio,
                    dataDisponibilizacaoFim: dataDisponibilizacaoFim,
                    pagina: pagina,
                    itensPorPagina: limite
                }
            });
            items = response.data.items;
            publicacoes.push(...items);
            ++pagina
        } while (items.length !== 0 || items.length === limite);

        return publicacoes;
    }
}

export default djen;