import type * as Party from 'partykit/server';
import { onConnect } from 'y-partykit';

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // 当有新用户（Web前端）连接时的回调
  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // A. 打印日志，方便调试
    //     console.log(
    //       `Connected:
    //   id: ${conn.id}
    //   room: ${this.room.id}
    //   url: ${new URL(ctx.request.url).pathname}`
    //     );

    // B. 关键：将连接交给 y-partykit 处理
    // 它会自动处理 Y.js 的握手、同步、广播
    return onConnect(conn, this.room, {
      // (未来) 我们将在这里添加持久化逻辑：
      // load: async () => { ...从 Neon 读取... },
      // callback: { handler: async (doc) => { ...保存到 Neon... } }
    });
  }
}

// 为此服务器设置一些配置
Server satisfies Party.Worker;
