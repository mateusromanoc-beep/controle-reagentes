import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { addTask, getTasks, updateTaskStatus, upsertTasks, TipoAlerta } from "./src/lib/db";

const app = express();
app.use(cors());

const server = new McpServer({
  name: "kanban-n8n-mcp",
  version: "1.0.0"
});

server.tool(
  "list_tasks",
  "Lista todas as tarefas no quadro Kanban",
  {},
  async () => {
    const tasks = await getTasks();
    return {
      content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }]
    };
  }
);

server.tool(
  "add_task",
  "Adiciona uma nova tarefa manualmente",
  {
    title: z.string().describe("Título da tarefa"),
    description: z.string().describe("Descrição da tarefa").default(""),
    status: z.enum(["Pendentes", "Em Resolução", "Resolvidos"]).describe("Status inicial da tarefa").default("Pendentes"),
    priority: z.enum(["Baixa", "Média", "Alta"]).describe("Prioridade").default("Média")
  },
  async ({ title, description, status, priority }) => {
    const newTask = await addTask({ title, description, status, priority, tipoAlerta: 'Geral' });
    return {
      content: [{ type: "text", text: `Tarefa adicionada com sucesso. ID: ${newTask.id}` }]
    };
  }
);

server.tool(
  "update_task_status",
  "Atualiza o status de uma tarefa",
  {
    id: z.string().describe("ID da tarefa"),
    status: z.enum(["Pendentes", "Em Resolução", "Resolvidos"]).describe("Novo status")
  },
  async ({ id, status }) => {
    const updated = await updateTaskStatus(id, status);
    if (!updated) {
      return {
        isError: true,
        content: [{ type: "text", text: `Tarefa com id ${id} não encontrada` }]
      };
    }
    return {
      content: [{ type: "text", text: `Tarefa ${id} atualizada para ${status}` }]
    };
  }
);

// N8N SYNC TOOL
server.tool(
  "sync_relatorio_estoque",
  "Sincroniza múltiplos alertas de reagentes gerados pelo n8n diretamente no painel Kanban.",
  {
    criticos: z.array(z.string()).describe("Lista de strings de estoque crítico").default([]),
    baixos: z.array(z.string()).describe("Lista de strings de estoque baixo").default([]),
    vencidos: z.array(z.string()).describe("Lista de strings de reagentes vencidos").default([]),
    vencendo_breve: z.array(z.string()).describe("Lista de strings de reagentes vencendo em 30 dias").default([]),
    em_uso_vencendo: z.array(z.string()).describe("Lista de strings de reagentes em uso com vencimento").default([])
  },
  async ({ criticos, baixos, vencidos, vencendo_breve, em_uso_vencendo }) => {
    const newTasks: any[] = [];

    const parseEntry = (entryStr: string, tipoAlerta: TipoAlerta, priority: 'Baixa' | 'Média' | 'Alta') => {
      // Ex: "159 | CAS: 50 | Fab: Dinamica | Lote: 123456 [EM USO] | Atual: 0 / Min: 1"
      const idParts = entryStr.split(" | ");
      const rawId = idParts[0].trim().replace(/\s/g, "-");
      
      return {
        id: `REA-${rawId}-${tipoAlerta.replace(/\s/g, "").toUpperCase()}`,
        title: `Reagente #${rawId}`,
        description: entryStr.replace(`${idParts[0]} | `, ''), // remove o ID da descricao
        status: "Pendentes",
        priority,
        tipoAlerta
      };
    };

    criticos.forEach(e => newTasks.push(parseEntry(e, "Estoque Crítico", "Alta")));
    vencidos.forEach(e => newTasks.push(parseEntry(e, "Vencido", "Alta")));
    em_uso_vencendo.forEach(e => newTasks.push(parseEntry(e, "Uso Vencendo", "Alta")));
    baixos.forEach(e => newTasks.push(parseEntry(e, "Estoque Baixo", "Média")));
    vencendo_breve.forEach(e => newTasks.push(parseEntry(e, "Vencendo Breve", "Média")));

    await upsertTasks(newTasks);

    return {
      content: [{ type: "text", text: `Sincronização concluída. ${newTasks.length} alertas sincronizados para o Kanban.` }]
    };
  }
);


let transport: SSEServerTransport | null = null;

app.get("/mcp", async (req, res) => {
  console.log("New MCP SSE connection");
  transport = new SSEServerTransport("/mcp/message", res);
  await server.connect(transport);
});

app.post("/mcp/message", async (req, res) => {
  if (!transport) {
    res.status(400).send("No valid SSE session");
    return;
  }
  await transport.handlePostMessage(req, res);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`MCP Server running on http://localhost:${PORT}/mcp`);
});
