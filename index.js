const http = require("http");
const https = require("https");
const { parse } = require("url");

const PORT = process.env.PORT || 8000;

// Create a basic HTTP server
const server = http.createServer((req, res) => {
  const url = parse(req.url);

  // Check if the request path matches the desired endpoint
  if (url.pathname === "/getTimeStories") {
    // Make a GET request to time.com
    const options = {
      hostname: "time.com",
      path: "/",
      method: "GET",
    };

    const request = https.request(options, (response) => {
      let body = [];
      //   console.log("line 22",body)

      // Concatenate the chunks of data received
      response
        .on("data", (chunk) => {
          // console.log("line 26",chunk)console.log("line 22",body)
          body.push(chunk);
        })
        .on("end", () => {
          body = Buffer.concat(body).toString();
          // console.log("line 31",body)
          // Extract elements with class "latest-stories__item"
          const latestStories = extractLatestStories(body);
          // Send the extracted data as JSON response
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(latestStories));
        });
    });

    // Handle errors with the request
    request.on("error", (error) => {
      console.error("Error fetching latest stories:", error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "Internal server error" }));
    });

    // Send the request
    request.end();
  } else {
    // Return a 404 error for unknown paths
    res.statusCode = 404;
    res.end("404 Not Found");
  }
});

// Function to extract latest stories from HTML content
function extractLatestStories(html) {
  const latestStories = [];
  const regex = /<li class="latest-stories__item">([\s\S]*?)<\/li>/g;
  let match;
  //   console.log(regex.exec(html))
  while ((match = regex.exec(html)) !== null && latestStories.length < 6) {
    const liContent = match[1];
    // console.log(liContent);
    const linkRegex = /<a href="([^"]+)">\s*<h3[^>]*>([^<]+)<\/h3>\s*<\/a>/;
    const linkMatch = liContent.match(linkRegex);
    if (linkMatch) {
      const link = `https://time.com` + linkMatch[1];
      const title = linkMatch[2].trim();
      latestStories.push({ title, link });
    }

    // Check if it's the last iteration or if we've already collected 6 stories
    // if (!regex.exec(html) || latestStories.length >= 6) {
    //   break;
    // }
  }
  return latestStories;
}

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
