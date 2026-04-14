import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listar(req, res) {
  try {
    const { destinatario, status, bloco, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (destinatario) where.destinatario = { contains: destinatario, mode: 'insensitive' };
    if (status) where.status = status;
    if (bloco) where.bloco = { contains: bloco, mode: 'insensitive' };

    const [total, encomendas] = await Promise.all([
      prisma.encomenda.count({ where }),
      prisma.encomenda.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          criadoPor: { select: { id: true, nome: true, username: true } },
        },
      }),
    ]);

    // Remove selfie da listagem para não pesar
    const data = encomendas.map(({ ...rest }) => rest);

    res.json({
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar encomendas.' });
  }
}

export async function buscarPorId(req, res) {
  try {
    const encomenda = await prisma.encomenda.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { criadoPor: { select: { id: true, nome: true, username: true } } },
    });
    if (!encomenda) return res.status(404).json({ error: 'Encomenda não encontrada.' });
    res.json(encomenda);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar encomenda.' });
  }
}

export async function criar(req, res) {
  try {
    const { destinatario, bloco, apartamento, horarioChegada, quantidadeItens, observacao } = req.body;

    if (!destinatario || !bloco || !apartamento || !horarioChegada || !quantidadeItens) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    const horario = horarioChegada.includes('+') || horarioChegada.includes('Z')
      ? new Date(horarioChegada)
      : new Date(horarioChegada + '-03:00');

    const encomenda = await prisma.encomenda.create({
      data: {
        destinatario,
        bloco,
        apartamento,
        horarioChegada: horario,
        quantidadeItens: parseInt(quantidadeItens),
        observacao: observacao || null,
        criadoPorId: req.user.id,
      },
      include: { criadoPor: { select: { id: true, nome: true, username: true } } },
    });

    res.status(201).json(encomenda);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar encomenda.' });
  }
}

export async function registrarRetirada(req, res) {
  try {
    const { retiradaPor, selfieRetirada } = req.body;

    if (!retiradaPor) {
      return res.status(400).json({ error: 'Nome de quem retirou é obrigatório.' });
    }

    const encomenda = await prisma.encomenda.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!encomenda) return res.status(404).json({ error: 'Encomenda não encontrada.' });
    if (encomenda.status === 'retirada') {
      return res.status(400).json({ error: 'Encomenda já foi retirada.' });
    }

    const atualizada = await prisma.encomenda.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'retirada',
        retiradaPor,
        selfieRetirada: selfieRetirada || null,
        dataRetirada: new Date(),
      },
      include: { criadoPor: { select: { id: true, nome: true, username: true } } },
    });

    // Remove selfie do retorno
    const { selfieRetirada: _, ...resto } = atualizada;
    res.json(resto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar retirada.' });
  }
}

export async function deletar(req, res) {
  try {
    await prisma.encomenda.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Encomenda deletada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar encomenda.' });
  }
}
