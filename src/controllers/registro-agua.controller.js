import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function listar(req, res) {
    try {
      const { dataLeitura, porteiroId, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
  
      const where = {};
      if (porteiroId) {
        where.porteiroId = parseInt(porteiroId); // ← Int, sem contains
      }
      if (dataLeitura) {
        where.dataLeitura = { gte: new Date(dataLeitura + '-03:00') };
      }
  
      const [total, registros] = await Promise.all([
        prisma.registroAgua.count({ where }),
        prisma.registroAgua.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { dataLeitura: 'desc' },
          include: {
            porteiro: { select: { id: true, nome: true, username: true } }, // ← traz dados do user
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

export async function criar(req, res) {
  const { porteiroId, leituraManha, dataLeitura } = req.body;

  if (!porteiroId || !leituraManha || !dataLeitura) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const porteiroExists = await prisma.user.findUnique({ where: { id: porteiroId } });
    if (!porteiroExists) return res.status(409).json({ error: 'Porteiro inexistente.' });

    const registroAgua = await prisma.registroAgua.create({
      data: { 
        porteiroId, 
        leituraManha: parseInt(leituraManha), 
        dataLeitura: new Date(dataLeitura + ':00.000+00:00').toISOString()
        ? (() => {
            // dataEntrada vem como "2026-04-09T23:45" (sem timezone = horário de SP)
            // Adiciona -03:00 para o Prisma não interpretar como UTC
            const d = dataLeitura.includes('+') || dataLeitura.includes('Z')
              ? new Date(dataLeitura)
              : new Date(dataLeitura + '-03:00');
            return d;
          })()
        : new Date(dataLeitura),
            },
      select: { id: true, porteiroId: true, leituraManha: true, dataLeitura: true, createdAt: true },
    });
    res.status(201).json(registroAgua);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar registro.' });
  }
}

export async function updateLeituraNoite(req, res) {
    try {
        const {leituraNoite, ...rest } = req.body;
        const leituraManha = await prisma.registroAgua.findUnique({where: {id: parseInt(req.params.id)}});
        if(!leituraManha) {

        }
        const leituraUpdate = await prisma.registroAgua.update({
          where: { id: parseInt(req.params.id) },
          data: {
            ...rest,
            leituraNoite: parseInt(leituraNoite),
            media: leituraNoite - leituraManha.leituraManha
          }
        });
        res.json(leituraUpdate);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar registro de agua.' });
      }
}

export async function deletar(req, res) {
  const id = parseInt(req.params.id);

  try {
    // Busca o registro para verificar existência e proprietário
    const registro = await prisma.registroAgua.findUnique({ where: { id } });
    if (!registro) {
      return res.status(404).json({ error: 'Registro de água não encontrado.' });
    }

    await prisma.registroAgua.delete({ where: { id } });
    res.json({ message: 'Registro de água excluído com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir registro de água.' });
  }
}
