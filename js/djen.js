import axios from 'https://cdn.jsdelivr.net/npm/axios@1.13.2/+esm'
import axiosRetry from 'https://cdn.jsdelivr.net/npm/axios-retry@4.5.0/+esm'

const client = axios.create({ baseURL: 'https://comunicaapi.pje.jus.br/api/v1' });
axiosRetry(client, { 
    retries: 6, 
    retryDelay: (retryCount, error) => { 
        console.log(error);
        if(error.response?.status === 429) {
            console.warn('Erro 429 recebido. Aguardando 1 minuto...');
            return 60_000;
        }

        return 3000;
    } 
});

const djen = {

    async publicacoes({ nomeParte, dataDisponibilizacaoInicio, dataDisponibilizacaoFim } = {}) {

        const limite = 100;
        let pagina = 1;
        let items = [];
        let publicacoes = []
        let count = 0;

        do {
            let response = await client.get(`/comunicacao`, {
                params: {
                    nomeParte: nomeParte,
                    dataDisponibilizacaoInicio: dataDisponibilizacaoInicio,
                    dataDisponibilizacaoFim: dataDisponibilizacaoFim,
                    pagina: pagina,
                    itensPorPagina: limite
                }
            });
            items = response.data.items;
            count = response.data.count;
            publicacoes.push(...items);
            ++pagina
        } while (publicacoes.length < count);

        return publicacoes;
    }
}

export default djen;