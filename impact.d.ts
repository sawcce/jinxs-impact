type EndpointResponse = {
  status?: Number;
  body?: Object | string;
  headers?: Record<string, any>;
};

type RequestHandler = ({ request }: any) => EndpointResponse;
