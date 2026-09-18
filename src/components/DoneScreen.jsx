import { useEffect, useRef, useState } from 'react';
import { toBlob } from 'html-to-image';
import { pad2 } from '../lib/dates';
import { whatsappLink } from '../lib/whatsapp';

function Countdown({ target }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  let ms = target - now;

  if (ms <= 0) {
    return (
      <span className="countdown">
        Chegou a hora! 🎈
      </span>
    );
  }

  const dd = Math.floor(ms / 86400000);

  ms %= 86400000;

  const hh = Math.floor(ms / 3600000);

  ms %= 3600000;

  const mm = Math.floor(ms / 60000);

  const ss = Math.floor((ms % 60000) / 1000);

  return (
    <span className="countdown">
      Faltam {dd}d {pad2(hh)}h {pad2(mm)}m {pad2(ss)}s.
    </span>
  );
}

function Status({ status }) {
  if (status.kind === 'saving') {
    return (
      <p className="status">
        Salvando...
      </p>
    );
  }

  if (status.kind === 'ok') {
    return (
      <p className="status ok">
        ✓ Salvo em {status.file}
      </p>
    );
  }

  if (status.kind === 'whatsapp') {
    return (
      <p className="status warn">
        Falta só um passo: toque em “Avisar no WhatsApp”
        pra eu receber sua resposta 💬
      </p>
    );
  }

  return (
    <p className="status warn">
      Salvo como arquivo de texto —{' '}
      <a
        className="dl"
        href={status.url}
        download={status.fileName}
      >
        baixar de novo
      </a>

      {status.mailto && (
        <>
          {' '}&nbsp;·&nbsp;{' '}

          <a
            className="dl"
            href={status.mailto}
          >
            enviar por e-mail
          </a>
        </>
      )}
    </p>
  );
}

const attempts = (n) =>
  n === 0
    ? 'nenhuma tentativa 😇'
    : `${n} ${
        n === 1
          ? 'tentativa frustrada'
          : 'tentativas frustradas'
      } 😄`;

export default function DoneScreen({
  result,
  onChangePlan,
}) {
  const {
    payload,
    dateLabel,
    timeLabel,
    foodLabel,
    target,
    status,
  } = result;

  const shareCardRef = useRef(null);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingImage, setSharingImage] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // ==========================================================
  // WhatsApp - Avisar o responsável
  // ==========================================================

  const wa = whatsappLink({
    pretty: payload.pretty,
    food: foodLabel,
    note: payload.note,
    dodges: payload.dodges_before_yes,
  });

  // ==========================================================
  // Mensagem escrita para compartilhar
  // ==========================================================

  const getWrittenShareLink = () => {
    const lines = [
      '💌 Convite para um date! 💖',
      '',
      `📅 Data: ${dateLabel}`,
      `🕐 Horário: ${timeLabel}`,
      `🍽️ Comida: ${foodLabel}`,
      payload.note
        ? `📝 Observações: ${payload.note}`
        : null,
      '',
      'Aceita esse date? 💖',
    ].filter(Boolean);

    return `https://wa.me/?text=${encodeURIComponent(
      lines.join('\n')
    )}`;
  };

  // ==========================================================
  // Gerar imagem
  // ==========================================================

  const generateInvitationImage = async () => {
    if (!shareCardRef.current) {
      throw new Error(
        'Não foi possível encontrar o convite.'
      );
    }

    const blob = await toBlob(
      shareCardRef.current,
      {
        pixelRatio: 2,
        cacheBust: true,
      }
    );

    if (!blob) {
      throw new Error(
        'Não foi possível gerar a imagem.'
      );
    }

    return blob;
  };

  // ==========================================================
  // Compartilhar imagem
  // ==========================================================

  const handleShareImage = async () => {
    try {
      setSharingImage(true);
      setShareMessage('');

      const blob = await generateInvitationImage();

      // ------------------------------------------------------
      // Tenta copiar a imagem para o clipboard.
      // Funciona muito bem no Chrome/Edge no macOS.
      // ------------------------------------------------------

      if (
        navigator.clipboard &&
        window.ClipboardItem
      ) {
        try {
          const item = new ClipboardItem({
            'image/png': blob,
          });

          await navigator.clipboard.write([
            item,
          ]);

          setShareMessage(
            'Imagem copiada! Agora abra o WhatsApp e pressione ⌘ + V para colar o convite.'
          );

          // Abre o WhatsApp Web em uma nova aba.
          window.open(
            'https://web.whatsapp.com/',
            '_blank',
            'noopener,noreferrer'
          );

          return;
        } catch (clipboardError) {
          console.warn(
            'Não foi possível copiar a imagem:',
            clipboardError
          );
        }
      }

      // ------------------------------------------------------
      // Fallback: baixa a imagem.
      // ------------------------------------------------------

      const imageUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = imageUrl;
      link.download = 'convite-date.png';

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(imageUrl);

      setShareMessage(
        'A imagem foi salva. Abra o WhatsApp e envie o arquivo do convite.'
      );

      window.open(
        'https://web.whatsapp.com/',
        '_blank',
        'noopener,noreferrer'
      );

    } catch (error) {
      console.error(
        'Erro ao compartilhar imagem:',
        error
      );

      setShareMessage(
        'Não foi possível gerar a imagem do convite.'
      );
    } finally {
      setSharingImage(false);
    }
  };

  // ==========================================================
  // Fechar modal
  // ==========================================================

  const closeShareModal = () => {
    if (sharingImage) return;

    setShareModalOpen(false);
    setShareMessage('');
  };

  return (
    <section className="screen done-screen">

      <div className="card">

        {/* ==================================================
            ÁREA DO CONVITE
            Essa parte será transformada em imagem.
            ================================================== */}

        <div
          ref={shareCardRef}
          className="share-card"
        >
          <p
            className="big"
            aria-hidden="true"
          >
            💌
          </p>

          <h1>
            É um <span className="grad">date</span>.
          </h1>

          <div className="receipt">

            <div>
              <span className="k">
                Resposta
              </span>

              <span className="v">
                Sim 💖
              </span>
            </div>

            <div>
              <span className="k">
                Data
              </span>

              <span className="v">
                {dateLabel}
              </span>
            </div>

            <div>
              <span className="k">
                Horário
              </span>

              <span className="v">
                {timeLabel}
              </span>
            </div>

            <div>
              <span className="k">
                Comida
              </span>

              <span className="v">
                {foodLabel}
              </span>
            </div>

            {payload.note && (
              <div>
                <span className="k">
                  Observações
                </span>

                <span className="v">
                  {payload.note}
                </span>
              </div>
            )}

            <div>
              <span className="k">
                Botão Não
              </span>

              <span className="v">
                {attempts(
                  payload.dodges_before_yes
                )}
              </span>
            </div>

          </div>

          <p className="sub tight">
            Vou ficar contando os dias.{' '}

            <Countdown
              target={target}
            />
          </p>
        </div>

        {/* ==================================================
            STATUS
            ================================================== */}

        <div aria-live="polite">
          <Status status={status} />
        </div>

        {/* ==================================================
            BOTÕES
            ================================================== */}

        <div className="rowend">

          {wa && (
            <a
              className="btn"
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
            >
              Avisar no WhatsApp 💬
            </a>
          )}

          <button
            type="button"
            className="btn"
            onClick={() => setShareModalOpen(true)}
          >
            Compartilhar no WhatsApp 📲
          </button>

          <button
            type="button"
            className="btn ghost"
            onClick={onChangePlan}
          >
            Mudar o plano
          </button>

        </div>

      </div>

      {/* ======================================================
          MODAL DE COMPARTILHAMENTO
          ====================================================== */}

      {shareModalOpen && (
        <div
          className="share-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeShareModal();
            }
          }}
        >

          <div
            className="share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
          >

            <button
              type="button"
              className="share-modal-close"
              onClick={closeShareModal}
              aria-label="Fechar"
              disabled={sharingImage}
            >
              ×
            </button>

            <div className="share-modal-icon">
              📲
            </div>

            <h2 id="share-modal-title">
              Compartilhar o convite
            </h2>

            <p className="share-modal-description">
              Escolha como você quer enviar o convite
              pelo WhatsApp.
            </p>

            <div className="share-options">

              {/* ==================================================
                  OPÇÃO 1 - IMAGEM
                  ================================================== */}

              <button
                type="button"
                className="share-option"
                onClick={handleShareImage}
                disabled={sharingImage}
              >
                <span className="share-option-icon">
                  🖼️
                </span>

                <span className="share-option-content">
                  <strong>
                    {sharingImage
                      ? 'Preparando imagem...'
                      : 'Imagem do convite'}
                  </strong>

                  <small>
                    Compartilhe exatamente o visual
                    que aparece na tela.
                  </small>
                </span>

                <span className="share-option-arrow">
                  →
                </span>
              </button>

              {/* ==================================================
                  OPÇÃO 2 - TEXTO
                  ================================================== */}

              <a
                className="share-option"
                href={getWrittenShareLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeShareModal}
              >
                <span className="share-option-icon">
                  💬
                </span>

                <span className="share-option-content">
                  <strong>
                    Convite escrito
                  </strong>

                  <small>
                    Envie a data, horário, comida
                    e observações em texto.
                  </small>
                </span>

                <span className="share-option-arrow">
                  →
                </span>
              </a>

            </div>

            {/* ==================================================
                MENSAGEM DA IMAGEM
                ================================================== */}

            {shareMessage && (
              <div className="share-message">
                {shareMessage}
              </div>
            )}

            <button
              type="button"
              className="btn ghost share-cancel"
              onClick={closeShareModal}
              disabled={sharingImage}
            >
              Cancelar
            </button>

          </div>

        </div>
      )}

    </section>
  );
}