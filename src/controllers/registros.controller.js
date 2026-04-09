import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listar(req, res) {
  try {
    const { nome, dataInicio, dataFim, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (nome) {
      where.nomePessoa = { contains: nome, mode: 'insensitive' };
    }
    if (dataInicio || dataFim) {
      where.dataEntrada = {};
      if (dataInicio) where.dataEntrada.gte = new Date(dataInicio);
      if (dataFim) {
        const end = new Date(dataFim);
        end.setHours(23, 59, 59, 999);
        where.dataEntrada.lte = end;
      }
    }

    const [total, registros] = await Promise.all([
      prisma.registro.count({ where }),
      prisma.registro.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { dataEntrada: 'desc' },
        include: {
          criadoPor: { select: { id: true, nome: true, username: true } },
        },
      }),
    ]);

    res.json({
      data: registros,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar registros.' });
  }
}

export async function buscarPorId(req, res) {
  try {
    const registro = await prisma.registro.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { criadoPor: { select: { id: true, nome: true, username: true } } },
    });
    if (!registro) return res.status(404).json({ error: 'Registro não encontrado.' });
    res.json(registro);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar registro.' });
  }
}

export async function criar(req, res) {
  try {
    const {
      nomePessoa, tipoAcesso,
      temVeiculo, modeloCarro, placa, dataEntrada, bloco, apartamento
    } = req.body;

    if (!nomePessoa || !tipoAcesso || !dataEntrada) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    const registro = await prisma.registro.create({
      data: {
        nomePessoa,
        tipoAcesso,
        temVeiculo: !!temVeiculo,
        modeloCarro: temVeiculo ? modeloCarro : null,
        placa: temVeiculo ? placa : null,
        dataEntrada: new Date(dataEntrada),
        criadoPorId: req.user.id,
        bloco,
        apartamento
      },
      include: { criadoPor: { select: { id: true, nome: true, username: true } } },
    });

    res.status(201).json(registro);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar registro.' });
  }
}

export async function atualizar(req, res) {
  try {
    const { dataSaida, ...rest } = req.body;
    const registro = await prisma.registro.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...rest,
        dataSaida: dataSaida ? new Date(dataSaida) : undefined,
      },
      include: { criadoPor: { select: { id: true, nome: true, username: true } } },
    });
    res.json(registro);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar registro.' });
  }
}

export async function registrarSaida(req, res) {
  try {
    const registro = await prisma.registro.update({
      where: { id: parseInt(req.params.id) },
      data: { dataSaida: new Date() },
      include: { criadoPor: { select: { id: true, nome: true, username: true } } },
    });
    res.json(registro);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar saída.' });
  }
}

export async function deletar(req, res) {
  try {
    await prisma.registro.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Registro deletado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar registro.' });
  }
}
