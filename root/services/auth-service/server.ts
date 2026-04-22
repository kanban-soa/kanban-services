import app from "./index";
import * as grpcLoader from "@grpc/proto-loader";
import * as grpc from "@grpc/grpc-js";
import path from "path";
import { UsersService, AuthService } from "@/auth-service/services";

const PROTO_DIR = path.join(__dirname, "proto");

const userProtoDefinition = grpcLoader.loadSync(path.join(PROTO_DIR, "user.proto"), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const sessionProtoDefinition = grpcLoader.loadSync(path.join(PROTO_DIR, "session.proto"), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(userProtoDefinition).users as any;
const sessionProto = grpc.loadPackageDefinition(sessionProtoDefinition).auth as any;

const server = new grpc.Server();

const mapDateToLong = (date: Date | null | undefined) => {
  return date ? date.getTime() : 0;
};

const mapUser = (user: any) => {
  if (!user) return null;
  return {
    ...user,
    created_at: mapDateToLong(user.createdAt),
    updated_at: mapDateToLong(user.updatedAt),
    email_verified: !!user.emailVerified,
  };
};

const mapSession = (session: any) => {
  if (!session) return null;
  return {
    ...session,
    user_id: session.userId,
    expires_at: mapDateToLong(session.expiresAt),
    created_at: mapDateToLong(session.createdAt),
    updated_at: mapDateToLong(session.updatedAt),
  };
};

const mapAccount = (account: any) => {
  if (!account) return null;
  return {
    ...account,
    user_id: account.userId,
    provider_id: account.providerId,
    account_id: account.accountId,
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    id_token: account.idToken,
    created_at: mapDateToLong(account.createdAt),
    updated_at: mapDateToLong(account.updatedAt),
  };
};

const mapVerification = (v: any) => {
  if (!v) return null;
  return {
    ...v,
    expires_at: mapDateToLong(v.expiresAt),
    created_at: mapDateToLong(v.createdAt),
    updated_at: mapDateToLong(v.updatedAt),
  };
};

server.addService(userProto.UserService.service, {
  createUser: async (call: any, callback: any) => {
    try {
      const user = await UsersService.createUser(call.request);
      callback(null, { user: mapUser(user) });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  login: async (call: any, callback: any) => {
    try {
      const user = await UsersService.login(call.request.email, call.request.password);
      callback(null, { user: mapUser(user) });
    } catch (error: any) {
      callback({ code: grpc.status.UNAUTHENTICATED, message: error.message });
    }
  },
  getUser: async (call: any, callback: any) => {
    try {
      const user = await UsersService.getUserById(call.request.id);
      if (!user) {
        callback({ code: grpc.status.NOT_FOUND, message: "User not found" });
        return;
      }
      callback(null, { user: mapUser(user) });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  getUserByEmail: async (call: any, callback: any) => {
    try {
      const user = await UsersService.getUserByEmail(call.request.email);
      if (!user) {
        callback({ code: grpc.status.NOT_FOUND, message: "User not found" });
        return;
      }
      callback(null, { user: mapUser(user) });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  updateUser: async (call: any, callback: any) => {
    try {
      const { id, ...data } = call.request;
      const user = await UsersService.updateUser(id, data);
      callback(null, { user: mapUser(user) });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  deleteUser: async (call: any, callback: any) => {
    try {
      await UsersService.deleteUser(call.request.id);
      callback(null, { success: true });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
});

server.addService(sessionProto.SessionService.service, {
  createSession: async (call: any, callback: any) => {
    try {
      const session = await AuthService.createSession(call.request);
      callback(null, { session: mapSession(session) });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  getSession: async (call: any, callback: any) => {
    try {
      const session = await AuthService.getSession(call.request.token);
      if (!session) {
        callback({ code: grpc.status.NOT_FOUND, message: "Session not found" });
        return;
      }
      callback(null, { session: mapSession(session) });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  getSessionWithUser: async (call: any, callback: any) => {
    try {
      const result = await AuthService.getSessionWithUser(call.request.token);
      if (!result) {
        callback({ code: grpc.status.NOT_FOUND, message: "Session not found" });
        return;
      }
      callback(null, {
        session: mapSession(result.session),
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          image: result.user.image
        }
      });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  deleteSession: async (call: any, callback: any) => {
    try {
      await AuthService.deleteSession(call.request.id);
      callback(null, { success: true });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  deleteUserSessions: async (call: any, callback: any) => {
    try {
      await AuthService.deleteUserSessions(call.request.user_id);
      callback(null, { success: true });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  linkAccount: async (call: any, callback: any) => {
    try {
      const account = await AuthService.linkAccount({
        userId: call.request.user_id,
        providerId: call.request.provider_id,
        accountId: call.request.account_id,
        accessToken: call.request.access_token,
        refreshToken: call.request.refresh_token,
        idToken: call.request.id_token,
        scope: call.request.scope,
      });
      callback(null, { account: mapAccount(account) });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  unlinkAccount: async (call: any, callback: any) => {
    try {
      await AuthService.unlinkAccount(call.request.user_id, call.request.provider_id);
      callback(null, { success: true });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  getUserAccounts: async (call: any, callback: any) => {
    try {
      const accounts = await AuthService.getUserAccounts(call.request.user_id);
      callback(null, { accounts: accounts.map(mapAccount) });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  createVerification: async (call: any, callback: any) => {
    try {
      const verification = await AuthService.createVerification({
        identifier: call.request.identifier,
        value: call.request.value,
        expiresInMinutes: call.request.expires_in_minutes,
      });
      callback(null, { verification: mapVerification(verification) });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  verifyCode: async (call: any, callback: any) => {
    try {
      await AuthService.verifyCode(call.request.identifier, call.request.code);
      callback(null, { success: true });
    } catch (error: any) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
});

const PORT = process.env.AUTH_GRPC_PORT || "9001";

server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error("Failed to bind gRPC server:", err);
    return;
  }
  console.log(`gRPC server running on port ${port}`);
});

export default server;
