type EndpointResponse<K = {}> = {
  status?: Number;
  body?: (Object | string) & K;
  headers?: Record<string, any>;
};

type RequestHandler = ({ request }: any) => EndpointResponse;
