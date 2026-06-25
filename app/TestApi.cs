using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        var handler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true
        };
        var client = new HttpClient(handler);
        var token = System.IO.File.ReadAllText(@""C:\Users\HP\.gemini\antigravity\token.txt"").Trim();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(""Bearer"", token);
        var response = await client.GetAsync(""https://localhost:7108/api/ServiceCenter/my-applications"");
        var content = await response.Content.ReadAsStringAsync();
        Console.WriteLine($""Status: {response.StatusCode}"");
        Console.WriteLine($""Content: {content}"");
    }
}
