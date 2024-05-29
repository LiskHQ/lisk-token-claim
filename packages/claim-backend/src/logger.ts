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
logger.level = process.env.BACKEND_LOGGER_LEVEL ?? 'debug';

export const truncate = (text: string): string => {
	if (text.length > 150) {
		return text.substring(0, 150) + ' ...';
	}
	return text;
};

export const formatRequest = (request: JSONRPCRequest) => {
	const method = request.method ?? 'EMPTY_METHOD';
	const params = request.params ?? {};

	return `${method}:${truncate(JSON.stringify(params))}`;
};

const expressLog = (
	req: Request,
	res: Response,
	next: NextFunction,
	error: Error | null = null,
) => {
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
};

export const expressLogger = (req: Request, res: Response, next: NextFunction) =>
	expressLog(req, res, next);

export const expressErrorHandler = (
	error: Error,
	req: Request,
	res: Response,
	next: NextFunction,
) => expressLog(req, res, next, error);

export const rpcLogger = async <ServerParams>(
	next: JSONRPCServerMiddlewareNext<ServerParams>,
	request: JSONRPCRequest,
	serverParams: ServerParams,
) => {
	const logger = log4js.getLogger('RPC');
	return next(request, serverParams).then((response: JSONRPCResponse | null) => {
		if (!response) {
			return response;
		}

		const message = `Request ${formatRequest(request)} | Response ${truncate(JSON.stringify(response))}`;
		if (response.error) {
			logger.warn(message);
		} else {
			logger.debug(message);
		}
		return response;
	});
};

export const rpcErrorHandler = async <ServerParams>(
	next: JSONRPCServerMiddlewareNext<ServerParams>,
	request: JSONRPCRequest,
	serverParams: ServerParams,
) => {
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
};

export default logger;
