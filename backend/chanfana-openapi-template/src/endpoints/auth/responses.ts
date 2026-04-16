import type { AppContext } from "../../types";

export function errorResponse(
	c: AppContext,
	status: 400 | 401 | 409 | 500,
	code: string,
	message: string,
) {
	return c.json(
		{
			success: false,
			errors: [{ code, message }],
		},
		status,
	);
}
