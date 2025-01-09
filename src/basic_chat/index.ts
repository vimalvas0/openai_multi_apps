// Let's build basic chat function

import OpenAI from "openai";
const openai = new OpenAI();
const context: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{ role: "system", content: "You are a helpful assistant." }];
const CONTEXT_LENGTH = 10;
const LOG_FILE_PATH = "chat.log";
import fs from "fs";
type FlightDetail = {
  from: string;
  to: string;
  flightNumber: string;
};

const flightReservations: any = {};

const flightDetailsData: FlightDetail[] = [
  {
    from: "New York",
    to: "Los Angeles",
    flightNumber: "101",
  },
  {
    from: "Los Angeles",
    to: "New York",
    flightNumber: "102",
  },
  {
    from: "New York",
    to: "San Francisco",
    flightNumber: "103",
  },
  {
    from: "San Francisco",
    to: "New York",
    flightNumber: "104",
  },
  {
    from: "New York",
    to: "Chicago",
    flightNumber: "105",
  },
];

function makeFlightReservation(flightNumber: string) {
  flightReservations[flightNumber] = true;
  return "Your flight has been booked.";
}

function getFlightsForRoute(from: string, to: string): string {
  const flights = flightDetailsData.filter((flight) => flight.from === from && flight.to === to).map((flight) => flight.flightNumber);
  if (flights.length) {
    return flights.join(" ");
  }

  return "No flights.";
}

async function createChatCompletion() {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: context,
    tools: [
      {
        type: "function",
        function: {
          name: "getFlightForRoute",
          description: "Get flight numbers for a route from one city to another",
          parameters: {
            type: "object",
            properties: {
              from: {
                type: "string",
                description: "The city from which the flight is departing",
              },
              to: {
                type: "string",
                description: "The city to which the flight is arriving",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "makeFlightReservation",
          description: "Make the reservation for a flight",
          parameters: {
            type: "object",
            properties: {
              flightNumber: {
                type: "string",
                description: "The flight number to make the reservation for",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "isFlightReserved",
          description: "Check if a flight is reserved",
          parameters: {
            type: "object",
            properties: {
              flightNumber: {
                type: "string",
                description: "The flight number to check reservation status for",
              },
            },
          },
        },
      },
    ],
    tool_choice: "auto", // the engine will decide which tool
  });

  const willInvokeFunction = response.choices[0].finish_reason == "tool_calls";
  const toolCall = response.choices[0].message.tool_calls![0];

  if (willInvokeFunction) {
    const toolName = toolCall.function.name;
    if (toolName == "getFlightForRoute") {
      const rawArguments = toolCall.function.arguments;
      const parsedArguments = JSON.parse(rawArguments);
      const toolResponse = getFlightsForRoute(parsedArguments?.from, parsedArguments.to);
      context.push(response.choices[0].message);
      context.push({
        role: "tool",
        content: toolResponse,
        tool_call_id: toolCall.id,
      });
    }

    if (toolName == "makeFlightReservation") {
      const rawArguments = toolCall.function.arguments;
      const parsedArguments = JSON.parse(rawArguments);
      const toolResponse = makeFlightReservation(parsedArguments.flightNumber);
      context.push(response.choices[0].message);
      context.push({
        role: "tool",
        content: toolResponse,
        tool_call_id: toolCall.id,
      });
    }

    if (toolName == "isFlightReserved") {
      const rawArguments = toolCall.function.arguments;
      const parsedArguments = JSON.parse(rawArguments);
      const toolResponse = makeFlightReservation(parsedArguments.flightNumber);
      context.push(response.choices[0].message);
      context.push({
        role: "tool",
        content: toolResponse,
        tool_call_id: toolCall.id,
      });
    }

    const response2 = await openai.chat.completions.create({
      messages: context,
      model: "gpt-4o",
    });

    console.log(response2.choices[0].message.content);
  }
}

function simpleLogger(contextArray: OpenAI.Chat.Completions.ChatCompletionMessageParam[]) {
  const dt = new Date().toISOString();
  fs.appendFileSync(LOG_FILE_PATH, `${dt} :: used context length: ${contextArray.length}\n`);
}

/** This function helps in retaining the context length as per desiredLength */
function appendToContext(object: OpenAI.Chat.Completions.ChatCompletionMessageParam, desiredLength: number = CONTEXT_LENGTH) {
  context.push(object);
  // only remove user context

  if (context.length > desiredLength) {
    context.splice(0, context.length - desiredLength);
  }
  simpleLogger(context);
}

// Process add listener to read user input
process.stdin.addListener("data", async (input) => {
  const userInput = input.toString().trim();
  appendToContext({ role: "user", content: userInput });

  // This is API response.
  await createChatCompletion();
});
