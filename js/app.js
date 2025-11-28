import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.15.2/dist/module.esm.js'
import fileSaver from 'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/+esm'
import moment from 'https://cdn.jsdelivr.net/npm/moment@2.30.1/+esm'
import Logger from './logger.js'
import djen from './djen.js'
import { filtrarPublicacoes } from  './utils.js'

document.addEventListener("alpine:init", () => {
    Alpine.data("app", () => ({
        form: {
            nomeParte: "NOVA IGUACU",
            dataPublicacao: moment().format('YYYY-MM-DD'),
        },
        logger: Alpine.reactive(new Logger()),
        keywords: ['procuradoria', 'prefeitura', 'municipio'],
        publicacoes: [],
        publicacoesFiltradas: [],
        loading: false,

        async submit() {
            this.loading = true;
            this.logger.clear()

            try {
                /** Pesquisar */
                this.logger.add('⏳',`Pesquisando publicações para ${this.form.nomeParte} em ${moment(this.form.dataPublicacao).format('DD/MM/YYYY')}`);
                await this.pesquisar();
                if(this.publicacoes.length === 0) return this.logger.add('⛔',`Nenhuma publicação encontrada`);
                this.logger.add('ℹ️',`${this.publicacoes.length} publicações encontradas`);
    
                /** Filtrar */
                this.logger.add('⏳', `Filtrando publicações`);
                this.publicacoesFiltradas = filtrarPublicacoes(this.publicacoes, this.keywords, this.form.nomeParte);
                if(this.publicacoesFiltradas.length === 0) return this.logger.add('⛔',`Nenhuma publicação filtrada`);
                this.logger.add('ℹ️', `${this.publicacoesFiltradas.length} publicações filtradas`);
    
                /** Salvar */
                this.logger.add('⏳', `Salvando em arquivo .docx`);
                await this.salvar();
                this.logger.add('✅', `Concluído!`);
            } finally {
                this.loading = false;
            }
        },

        async pesquisar() {
            try {
                this.publicacoes = await djen.publicacoes({ 
                    nomeParte: this.form.nomeParte,
                    dataDisponibilizacaoInicio: this.form.dataPublicacao,
                    dataDisponibilizacaoFim: this.form.dataPublicacao,
                });
            } catch (err) {
                this.logger.add('⛔', "Erro ao consultar publicações, tente novamente");
                throw(err);
            }
        },

        async salvar() {
            let parts = [];

            this.publicacoesFiltradas.forEach(pub => {
                parts.push(`<span>`);
                parts.push(`<span class="publicacao-title">Processo ${pub.numeroprocessocommascara}</span><br>`);
                parts.push(`<span><strong>Órgão: </strong> ${pub.nomeOrgao}</span><br>`);
                parts.push(`<span><strong>Data de disponibilização: </strong>${moment(pub.data_disponibilizacao).format('DD/MM/YYYY')}</span><br>`);
                parts.push(`<span><strong>Tipo de comunicação: </strong>${pub.tipoComunicacao}</span><br>`);
                parts.push(`<span><strong>Meio: </strong> ${pub.meiocompleto}</span><br>`);
                
                if(pub.link) {
                    parts.push(`<span><strong>Inteiro teor: </strong></span>`);
                    parts.push(`<a href="${pub.link}">Clique aqui</a><br>`);
                }
                
                parts.push(`<span><strong>Parte(s) </strong></span><br>`);
                parts.push(pub.destinatarios.map(d => `<span>${d.nome}</span><br>`).join(''));
                
                if(pub.destinatarioadvogados.length) {
                    parts.push(`<span><strong>Advogado(s) </strong></span><br>`);
                    parts.push(pub.destinatarioadvogados.map(d => `<span>${d.advogado.nome} - OAB ${d.advogado.uf_oab}-${d.advogado.numero_oab}</span><br>`).join(''));
                }
                
                parts.push(`<section>${pub.texto}</section><br>`);
                parts.push(`</span>`);
                parts.push(`<br>`);
            });

            const html = `<!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: 'Calibri Light'; 
                            font-size: 13px; 
                            color: #4C4C4C;
                        }

                        strong {
                            color: #0A243B;
                        }

                        a {
                            text-decoration: none;
                        }

                        .publicacao-title {
                            color: #004BCB !important;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    ${ parts.join('') }
                </body>
                </html>`;

            const converter = window.htmlDocx.asBlob;
            const docxBlob = await converter(html);
            fileSaver.saveAs(docxBlob, `publicações-${moment().format('DD-MM-YYYY')}.docx`);
        },
    }));
});

Alpine.start()