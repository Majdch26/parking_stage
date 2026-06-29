using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace parkinguniversitysystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class testController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Unauthorized("YOu cannot access this resource");
            //return Ok("Hello from TestController 🚀");
        }
    }
}
