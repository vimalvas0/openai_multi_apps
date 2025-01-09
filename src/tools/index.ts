import OpenAI from "openai";
const openAI = new OpenAI();

// function getTimeOfTheDay() {
//   const date = new Date();
//   const hours = date.getHours();
//   if (hours < 12) return "morning";
//   if (hours < 18) return "afternoon";
//   return "evening";
// }

function getTimeOfDay() {
  const date = new Date();
  return date.getHours().toString();
}

function getOrderStatus(orderId: string) {
  if (orderId == "101") {
    return "Delivered";
  } else {
    return "Not Delivered";
  }
}

async function callOpenAIWithTool() {
  const context: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You are a helpful assistant that gives information about the time of day",
    },
    {
      role: "user",
      content: "What is the status of order 102?",
    },
  ];

  // Setting up the openAI chat completion for using out tools.
  const response = await openAI.chat.completions.create({
    model: "gpt-4o",
    messages: context,
    tools: [
      {
        type: "function",
        function: {
          name: "getTimeOfDay",
          description: "Get the time of day",
        },
      },
      {
        type: "function",
        function: {
          name: "getTimeOfTheDay",
          description: "Morning, Afternoon and Night on basis of current time of the day",
        },
      },
      {
        type: "function",
        function: {
          name: "getOrderStatus",
          description: "Get the status of a specific order.",
          parameters: {
            type: "object",
            properties: {
              orderId: {
                type: "string",
                description: "The id of the order to get status of",
              },
            },
          },
        },
      },
    ],
    tool_choice: "auto", // the engine will decide which tool
  });

  console.log(response.choices[0].message.content);

  const willInvokeFunction = response.choices[0].finish_reason == "tool_calls";
  const toolCall = response.choices[0].message.tool_calls![0];
  console.log(toolCall);

  if (willInvokeFunction) {
    const toolName = toolCall.function.name;
    console.log(typeof toolCall);
    if (toolName == "getTimeOfDay") {
      const toolResponse = getTimeOfDay();
      context.push(response.choices[0].message);
      context.push({
        role: "tool",
        content: toolResponse,
        tool_call_id: toolCall.id,
      });
    }

    if (toolName == "getOrderStatus") {
      const rawArguments = toolCall.function.arguments;
      const parsedArguments = JSON.parse(rawArguments);
      const toolResponse = getOrderStatus(parsedArguments.orderId);
      context.push(response.choices[0].message);
      context.push({
        role: "tool",
        content: toolResponse,
        tool_call_id: toolCall.id,
      });
    }

    const response2 = await openAI.chat.completions.create({
      messages: context,
      model: "gpt-4o",
    });

    console.log(response2.choices[0].message.content);
  }
}

callOpenAIWithTool();
