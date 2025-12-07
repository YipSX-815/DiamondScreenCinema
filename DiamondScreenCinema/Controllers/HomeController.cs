using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiamondScreenCinema.Controllers;

public class HomeController : Controller
{
    private readonly DB db;
    private readonly IWebHostEnvironment en;

    public HomeController(DB db, IWebHostEnvironment en)
    {
        this.db = db;
        this.en = en;
    }

    public async Task<IActionResult> Index()
    {
        var heroMovies = await db.Movies
            .Where(m => m.Status == "Showing")
            .OrderByDescending(m => m.ReleaseDate)
            .ToListAsync();

        var top3Movies = await db.Movies
            .Where(m => m.Status == "Showing")
            .OrderByDescending(m => m.ReleaseDate)
            .Take(3)
            .ToListAsync();

        var nowShowingMovies = await db.Movies
            .Where(m => m.Status == "Showing")
            .OrderByDescending(m => m.ReleaseDate)
            .Take(10)
            .ToListAsync();

        var comingSoonMovies = await db.Movies
            .Where(m => m.Status == "Upcoming")
            .OrderBy(m => m.ReleaseDate)
            .Take(10)
            .ToListAsync();

        var viewModel = new HomeViewModel
        {
            HeroMovies = heroMovies.Select(m => new Movie
            {
                MovieId = m.MovieId,
                Title = m.Title,
                Genre = m.Genre,
                Duration = m.Duration,
                ReleaseDate = m.ReleaseDate,
                HorizontalPoster = GetPosterPath(m.HorizontalPoster!),
                Poster = GetPosterPath(m.Poster),
                Classification = m.Classification,
                Language = m.Language,
                Director = m.Director,
                Cast = m.Cast,
                Subtitle = m.Subtitle,
                Synopsis = m.Synopsis,
                Trailer = GetTrailerPath(m.Trailer)
            }).ToList(),

            Top3Movies = top3Movies.Select(m => new Movie
            {
                MovieId = m.MovieId,
                Title = m.Title,
                Genre = m.Genre,
                Duration = m.Duration,
                ReleaseDate = m.ReleaseDate,
                Poster = GetPosterPath(m.Poster),
                Classification = m.Classification
            }).ToList(),

            NowShowingMovies = nowShowingMovies.Select(m => new Movie
            {
                MovieId = m.MovieId,
                Title = m.Title,
                Genre = m.Genre,
                Duration = m.Duration,
                ReleaseDate = m.ReleaseDate,
                Poster = GetPosterPath(m.Poster),
                Classification = m.Classification
            }).ToList(),

            ComingSoonMovies = comingSoonMovies.Select(m => new Movie
            {
                MovieId = m.MovieId,
                Title = m.Title,
                Genre = m.Genre,
                Duration = m.Duration,
                ReleaseDate = m.ReleaseDate,
                Poster = GetPosterPath(m.Poster),
                Classification = m.Classification
            }).ToList()
        };

        return View(viewModel);
    }

    public async Task<IActionResult> MovieMenu()
    {
        var showingNowMovies = await db.Movies
            .Where(m => m.Status == "Showing")
            .OrderByDescending(m => m.ReleaseDate)
            .ToListAsync();

        var comingSoonMovies = await db.Movies
            .Where(m => m.Status == "Upcoming")
            .OrderBy(m => m.ReleaseDate)
            .ToListAsync();

        var topRatedMovies = await db.Movies
            .Where(m => m.Status == "Showing")
            .OrderByDescending(m => m.ReleaseDate)
            .Take(20)
            .ToListAsync();

        var viewModel = new MovieMenuViewModel
        {
            ShowingNowMovies = showingNowMovies.Select(m => new Movie
            {
                MovieId = m.MovieId,
                Title = m.Title,
                Genre = m.Genre,
                Duration = m.Duration,
                Language = m.Language,
                ReleaseDate = m.ReleaseDate,
                Poster = GetPosterPath(m.Poster),
                Classification = m.Classification,
                Synopsis = m.Synopsis
            }).ToList(),

            ComingSoonMovies = comingSoonMovies.Select(m => new Movie
            {
                MovieId = m.MovieId,
                Title = m.Title,
                Genre = m.Genre,
                Duration = m.Duration,
                Language = m.Language,
                ReleaseDate = m.ReleaseDate,
                Poster = GetPosterPath(m.Poster),
                Classification = m.Classification
            }).ToList(),

            TopRatedMovies = topRatedMovies.Select(m => new Movie
            {
                MovieId = m.MovieId,
                Title = m.Title,
                Genre = m.Genre,
                Duration = m.Duration,
                Language = m.Language,
                ReleaseDate = m.ReleaseDate,
                Poster = GetPosterPath(m.Poster),
                Classification = m.Classification,
                Synopsis = m.Synopsis
            }).ToList()
        };

        return View("Movie/MovieMenu", viewModel);
    }



    private string GetPosterPath(string posterFileName)
    {
        if (string.IsNullOrEmpty(posterFileName))
            return null;

        if (posterFileName.StartsWith("http://") || posterFileName.StartsWith("https://"))
            return posterFileName;

        if (posterFileName.StartsWith("/MovieUpload/Poster/", StringComparison.OrdinalIgnoreCase) ||
            posterFileName.StartsWith("/MovieUpload/poster/", StringComparison.OrdinalIgnoreCase))
        {
            var lastSlashIndex = posterFileName.LastIndexOf('/');
            if (lastSlashIndex >= 0 && lastSlashIndex < posterFileName.Length - 1)
            {
                return posterFileName.Substring(lastSlashIndex + 1);
            }
        }

        if (posterFileName.StartsWith("/"))
            return posterFileName;

        if (posterFileName.StartsWith("~"))
            return posterFileName;

        return posterFileName;
    }


    private string GetTrailerPath(string trailerFileName)
    {
        if (string.IsNullOrEmpty(trailerFileName))
            return null;

        if (trailerFileName.Contains("youtube.com") || trailerFileName.Contains("youtu.be"))
            return trailerFileName;

        if (trailerFileName.StartsWith("http://") || trailerFileName.StartsWith("https://"))
            return trailerFileName;

        if (trailerFileName.StartsWith("/MovieUpload/Trailer/", StringComparison.OrdinalIgnoreCase) ||
            trailerFileName.StartsWith("/MovieUpload/trailer/", StringComparison.OrdinalIgnoreCase))
        {
            var lastSlashIndex = trailerFileName.LastIndexOf('/');
            if (lastSlashIndex >= 0 && lastSlashIndex < trailerFileName.Length - 1)
            {
                return trailerFileName.Substring(lastSlashIndex + 1);
            }
        }

        if (trailerFileName.StartsWith("/"))
            return trailerFileName;

        return trailerFileName;
    }


    [Route("Home/Movie")]
    [HttpGet]
    public async Task<IActionResult> MovieInfo(string id)
    {
        if (string.IsNullOrEmpty(id))
        {
            return NotFound();
        }

        var movie = await db.Movies
            .Include(m => m.Reviews)
                .ThenInclude(r => r.User)
            .FirstOrDefaultAsync(m => m.MovieId == id);

        if (movie == null)
        {
            return NotFound();
        }

        var movieVM = new MovieVM
        {
            MovieId = movie.MovieId,
            Title = movie.Title,
            Genre = movie.Genre,
            Duration = movie.Duration,
            Language = movie.Language,
            Director = movie.Director,
            Cast = movie.Cast,
            Classification = movie.Classification,
            Subtitle = movie.Subtitle,
            ReleaseDate = movie.ReleaseDate,
            Status = movie.Status,
            Synopsis = movie.Synopsis,
            Poster = GetPosterPath(movie.Poster),
            Trailer = GetTrailerPath(movie.Trailer)
        };

        return View("Movie/MovieInfo", movieVM);
    }
}