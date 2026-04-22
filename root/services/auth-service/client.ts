import * as grpc from "@grpc/grpc-js";
import * as grpcLoader from "@grpc/proto-loader";
import path from "path";

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

const AUTH_GRPC_HOST = process.env.AUTH_GRPC_HOST || "localhost";
const AUTH_GRPC_PORT = process.env.AUTH_GRPC_PORT || "9001";

export const userClient = new userProto.UserService(
  `${AUTH_GRPC_HOST}:${AUTH_GRPC_PORT}`,
  grpc.credentials.createInsecure()
);

export const sessionClient = new sessionProto.SessionService(
  `${AUTH_GRPC_HOST}:${AUTH_GRPC_PORT}`,
  grpc.credentials.createInsecure()
);

// Helper function to convert callback-based gRPC calls to Promises
export function promisify(client: any, method: string, request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    client[method](request, (err: any, response: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
}

export const authServiceClient = {
  users: {
    createUser: (req: any) => promisify(userClient, "createUser", req),
    login: (req: any) => promisify(userClient, "login", req),
    getUser: (req: any) => promisify(userClient, "getUser", req),
    getUserByEmail: (req: any) => promisify(userClient, "getUserByEmail", req),
    updateUser: (req: any) => promisify(userClient, "updateUser", req),
    deleteUser: (req: any) => promisify(userClient, "deleteUser", req),
  },
  sessions: {
    createSession: (req: any) => promisify(sessionClient, "createSession", req),
    getSession: (req: any) => promisify(sessionClient, "getSession", req),
    getSessionWithUser: (req: any) => promisify(sessionClient, "getSessionWithUser", req),
    deleteSession: (req: any) => promisify(sessionClient, "deleteSession", req),
    deleteUserSessions: (req: any) => promisify(sessionClient, "deleteUserSessions", req),
    linkAccount: (req: any) => promisify(sessionClient, "linkAccount", req),
    unlinkAccount: (req: any) => promisify(sessionClient, "unlinkAccount", req),
    getUserAccounts: (req: any) => promisify(sessionClient, "getUserAccounts", req),
    createVerification: (req: any) => promisify(sessionClient, "createVerification", req),
    verifyCode: (req: any) => promisify(sessionClient, "verifyCode", req),
  },
};
