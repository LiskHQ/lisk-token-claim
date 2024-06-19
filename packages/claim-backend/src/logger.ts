import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import log4js from 'log4js';
import {
	JSONRPCRequest,
	JSONRPCServerMiddlewareNext,
	createJSONRPCErrorResponse,
	JSONRPCResponse,
	JSONRPCErrorCode,
} from 'json-rpc-2.0';
import { ErrorCode } from './utils/error';
dotenv.config();

const logger = log4js.getLogger();
logger.level = process.env.BACKEND_LOGGER_LEVEL ?? 'info';

export const TRUNCATE_LENGTH = 150;

export function truncate(text: string): string {
	if (text.length > TRUNCATE_LENGTH) {
		return text.substring(0, TRUNCATE_LENGTH) + ' ...';
	}
	return text;
}

export function formatRequest(request: JSONRPCRequest): string {
	const method = request.method ?? 'EMPTY_METHOD';
	const params = request.params ?? {};

	return `${method}:${truncate(JSON.stringify(params))}`;
}

function expressLog(req: Request, res: Response, next: NextFunction, error: Error | null = null) {
	const logger = log4js.getLogger('HTTP');
	const header =
		':remote-addr - ":method :url HTTP/:http-version" :status :content-length ":referrer" ":user-agent" :response-time';

	let level = 'debug';
	let getMessage = (req: Request) => `${header} "${truncate(JSON.stringify(req.body))}"`;
	if (error) {
		if (error.message) {
			level = 'warn';
			getMessage = () => `${header} "${error.message}"`;
		} else {
			logger.error(`Error Occurred: ${JSON.stringify(error)}`);
		}
	}

	return log4js.connectLogger(logger, {
		level,
		format: (req: Request, _res: Response, formatter: (str: string) => string) => {
			return formatter(getMessage(req));
		},
	})(req, res, next);
}

export function expressLogger(req: Request, res: Response, next: NextFunction) {
	return expressLog(req, res, next);
}

export function expressErrorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
	return expressLog(req, res, next, error);
}

export async function rpcLogger<ServerParams>(
	next: JSONRPCServerMiddlewareNext<ServerParams>,
	request: JSONRPCRequest,
	serverParams: ServerParams,
) {
	const logger = log4js.getLogger('RPC');
	return next(request, serverParams).then((response: JSONRPCResponse | null) => {
		if (!response) {
			return response;
		}

		const message = `Request ${formatRequest(request)} | Response ${truncate(JSON.stringify(response))}`;
		if (response.error) {
			logger.warn(message);
		} else {
			logger.info(message);
		}
		return response;
	});
}

export async function rpcErrorHandler<ServerParams>(
	next: JSONRPCServerMiddlewareNext<ServerParams>,
	request: JSONRPCRequest,
	serverParams: ServerParams,
) {
	try {
		return await next(request, serverParams);
	} catch (error) {
		if (error instanceof Error) {
			if (Object.values(ErrorCode).includes(error.message as ErrorCode)) {
				return createJSONRPCErrorResponse(
					request.id ?? null,
					JSONRPCErrorCode.InvalidRequest,
					error.message,
				);
			}
			// Other RPC Error has been handled by library
			return createJSONRPCErrorResponse(
				request.id ?? null,
				JSONRPCErrorCode.InternalError,
				error.message,
			);
		} else {
			throw error;
		}
	}
}

export default logger;
