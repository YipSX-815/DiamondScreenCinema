using DiamondScreenCinema.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiamondScreenCinema.Controllers;

public class AdminController : Controller
{
    private readonly DB db;
    private readonly IWebHostEnvironment en;

    public AdminController(DB db, IWebHostEnvironment en)
    {
        this.db = db;
        this.en = en;
    }

    public IActionResult Index() => RedirectToAction("Dashboard");

    public IActionResult Dashboard()
    {
        ViewBag.title = "Diamond Screen Cinema - Admin Dashboard";
        return View();
    }

    public IActionResult Cinemas(string? Page)
    {
        switch (Page)
        {
            case "CinemaManagement":
                ViewBag.title = "Diamond Screen Cinema - CinemaManagement";
                return View("Cinemas/CinemaManagement");
            case "HallManagement":
                ViewBag.title = "Diamond Screen Cinema - HallManagement";
                return View("Cinemas/HallManagement");
            case "CreateHall":
                ViewBag.title = "Diamond Screen Cinema - Create New Hall";
                return View("Cinemas/CreateHall");
            case "ViewHall":
                ViewBag.title = "Diamond Screen Cinema - View Hall";
                return View("Cinemas/ViewHall");
            case "UpdateHall":
                ViewBag.title = "Diamond Screen Cinema - Update Hall";
                return View("Cinemas/UpdateHall");
            case "CreateCinema":
                ViewBag.title = "Diamond Screen Cinema - Create New Cinema";
                return View("Cinemas/CreateCinema");
            case "ViewCinema":
                ViewBag.title = "Diamond Screen Cinema - View Cinema";
                return View("Cinemas/ViewCinema");
            case "UpdateCinema":
                ViewBag.title = "Diamond Screen Cinema - Update Cinema";
                return View("Cinemas/UpdateCinema");
            default:
                ViewBag.title = "Diamond Screen Cinema - SeatManagement";
                return View("Cinemas/SeatManagement");
        }
    }

    public IActionResult Users(string? Page)
    {
        if (Page == "CustomerManagement")
        {
            ViewBag.title = "Diamond Screen Cinema - CustomerManagement";
            return View("Users/CustomerManagement");
        }
        else if (Page == "StaffManagement")
        {
            ViewBag.title = "Diamond Screen Cinema - StaffManagement";
            return View("Users/StaffManagement");
        }
        else if (Page == "UpdateCustomer")
        {
            ViewBag.title = "Diamond Screen Cinema - Update Customer Details";
            return View("Users/UpdateCustomer");
        }
        else if (Page == "CreateCustomer")
        {
            ViewBag.title = "Diamond Screen Cinema - Create New Customer";
            return View("Users/CreateCustomer");
        }
        else if (Page == "UpdateStaff")
        {
            ViewBag.title = "Diamond Screen Cinema - Update Staff Details";
            return View("Users/UpdateStaff");
        }
        else if (Page == "CreateStaff")
        { 
            ViewBag.title = "Diamond Screen Cinema - Create New Staff";
            return View("Users/CreateStaff");
        }
        else if (Page == "UpdateAdmin")
        {
            ViewBag.title = "Diamond Screen Cinema - Update Admin Details";
            return View("Users/UpdateAdmin");
        }
        else if (Page == "CreateAdmin")
        {
            ViewBag.title = "Diamond Screen Cinema - Create New Admin";
            return View("Users/CreateAdmin");
        }
        else
        {
            ViewBag.title = "Diamond Screen Cinema - AdminManagement";
            return View("Users/AdminManagement");
        }
    }

    public async Task<IActionResult> Movies(string Page)
    {
        switch (Page)
        {
            case "MovieManagement":
                ViewBag.title = "Diamond Screen Cinema - Movie Management";
                return await MovieManagement();
            case "ShowtimeManagement":
                ViewBag.title = "Diamond Screen Cinema - Showtime Management";
                return View("Movies/ShowtimeManagement");
            case "MovieCreate":
                ViewBag.title = "Diamond Screen Cinema - Movie Create";
                return View("Movies/MovieCreate", new MovieVM());
            case "MovieDetail":
                ViewBag.title = "Diamond Screen Cinema - Movie Detail";
                return MovieDetail(Request.Query["id"]!);
            case "MovieUpdate":
                ViewBag.title = "Diamond Screen Cinema - Movie Update";
                return MovieUpdate(Request.Query["id"]!);
            case "ShowtimeCUD":
                ViewBag.title = "Diamond Screen Cinema - Showtime CUD";

                var movies = db.Movies
                    .OrderBy(m => m.Title)
                    .Select(m => new MovieVM
                    {
                        MovieId = m.MovieId,
                        Title = m.Title,
                        Genre = m.Genre,
                        Duration = m.Duration,
                        Language = m.Language,
                        Status = m.Status,
                        Poster = m.Poster,
                        ReleaseDate = m.ReleaseDate
                    })
                    .ToList();

                return View("Movies/ShowtimeCUD", movies);
            default:
                return RedirectToAction("Movies", new { Page = "MovieManagement" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> MovieManagement(string search = "",
         string genreFilter = "", string languageFilter = "", string sortBy = "title",
         string statusFilter = "all", int page = 1, bool ajax = false)
    {
        await AutoUpdateMovieStatuses();
        const int PageSize = 8;
        var query = db.Movies.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();
            query = query.Where(m =>
                m.Title.Contains(search) ||
                m.MovieId.Contains(search) ||
                m.Director.Contains(search) ||
                m.Cast.Contains(search)
            );
        }

        if (!string.IsNullOrEmpty(genreFilter))
            query = query.Where(m => m.Genre == genreFilter);

        if (!string.IsNullOrEmpty(languageFilter))
            query = query.Where(m => m.Language == languageFilter);

        if (statusFilter != "all")
            query = query.Where(m => m.Status.ToLower() == statusFilter.ToLower());

        query = sortBy switch
        {
            "title-desc" => query.OrderByDescending(m => m.Title),
            "release_date" => query.OrderByDescending(m => m.ReleaseDate),
            "release_date_old" => query.OrderBy(m => m.ReleaseDate),
            _ => query.OrderBy(m => m.Title)
        };

        int total = await query.CountAsync();
        var movies = await query.Skip((page - 1) * PageSize).Take(PageSize).ToListAsync();

        ViewBag.CurrentPage = page;
        ViewBag.TotalPages = (int)Math.Ceiling(total / (double)PageSize);

        ViewBag.StatusCounts = new Dictionary<string, int>
    {
        { "all", await db.Movies.CountAsync() },
        { "showing", await db.Movies.CountAsync(m => m.Status == "Showing") },
        { "upcoming", await db.Movies.CountAsync(m => m.Status == "Upcoming") },
        { "cancelled", await db.Movies.CountAsync(m => m.Status == "Cancelled") },
    };

        if (ajax)
            return PartialView("Movies/_MovieListing", movies);

        return View("Movies/MovieManagement", movies);
    }


    public async Task<IActionResult> DeleteMovie(string id)
    {
        var movie = await db.Movies.FindAsync(id);
        if (movie == null) return NotFound();

        if (!string.IsNullOrEmpty(movie.Poster))
        {
            var posterPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", movie.Poster.TrimStart('/'));
            if (System.IO.File.Exists(posterPath))
                System.IO.File.Delete(posterPath);
        }

        if (!string.IsNullOrEmpty(movie.Trailer))
        {
            var trailerPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", movie.Trailer.TrimStart('/'));
            if (System.IO.File.Exists(trailerPath))
                System.IO.File.Delete(trailerPath);
        }

        if (!string.IsNullOrEmpty(movie.HorizontalPoster))
        {
            var hPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", movie.HorizontalPoster.TrimStart('/'));
            if (System.IO.File.Exists(hPath))
                System.IO.File.Delete(hPath);
        }

        db.Movies.Remove(movie);
        await db.SaveChangesAsync();

        return RedirectToAction("Movies", new { Page = "MovieManagement" });
    }

    [HttpPost]
    public async Task<IActionResult> DeleteSelected([FromForm] string[] selectedIds)
    {
        if (selectedIds != null && selectedIds.Length > 0)
        {
            var movies = await db.Movies
                .Where(m => selectedIds.Contains(m.MovieId))
                .ToListAsync();

            foreach (var movie in movies)
            {
                if (!string.IsNullOrEmpty(movie.Poster))
                {
                    var posterPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", movie.Poster.TrimStart('/'));
                    if (System.IO.File.Exists(posterPath))
                        System.IO.File.Delete(posterPath);
                }

                if (!string.IsNullOrEmpty(movie.Trailer))
                {
                    var trailerPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", movie.Trailer.TrimStart('/'));
                    if (System.IO.File.Exists(trailerPath))
                        System.IO.File.Delete(trailerPath);
                }
                if (!string.IsNullOrEmpty(movie.Trailer))
                {
                    var hPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", movie.HorizontalPoster.TrimStart('/'));
                    if (System.IO.File.Exists(hPath))
                        System.IO.File.Delete(hPath);
                }

                db.Movies.Remove(movie);
            }

            await db.SaveChangesAsync();
        }

        return RedirectToAction("Movies", new { Page = "MovieManagement" });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> MovieCreate(MovieVM model)
    {
        if (string.IsNullOrWhiteSpace(model.Title) ||
            string.IsNullOrWhiteSpace(model.Genre) ||
            model.Duration <= 0 ||
            string.IsNullOrWhiteSpace(model.Language) ||
            string.IsNullOrWhiteSpace(model.Director) ||
            string.IsNullOrWhiteSpace(model.Cast) ||
            string.IsNullOrWhiteSpace(model.Classification) ||
            string.IsNullOrWhiteSpace(model.Subtitle) ||
            model.ReleaseDate == default ||
            model.PosterFile == null)
        {
            TempData["NotificationMessage"] = "Please fill in all required fields.";
            TempData["NotificationType"] = "warning";
            return View("Movies/MovieCreate", model);
        }

        if (model.Title.Length > 200)
        {
            TempData["NotificationMessage"] = "Title cannot exceed 200 characters.";
            TempData["NotificationType"] = "warning";
            return View("Movies/MovieCreate", model);
        }

        var existingMovie = await db.Movies
            .FirstOrDefaultAsync(m => m.Title.ToLower() == model.Title.ToLower());

        if (existingMovie != null)
        {
            TempData["NotificationMessage"] = "A movie with this title already exists.";
            TempData["NotificationType"] = "warning";
            return View("Movies/MovieCreate", model);
        }

        if (model.Duration < 30 || model.Duration > 300)
        {
            TempData["NotificationMessage"] = "Duration must be between 30 and 300 minutes.";
            TempData["NotificationType"] = "warning";
            return View("Movies/MovieCreate", model);
        }

        if (model.ReleaseDate.Year < 1900 || model.ReleaseDate.Year > DateTime.Today.Year + 5)
        {
            TempData["NotificationMessage"] = "Release date must be between 1900 and 5 years from now.";
            TempData["NotificationType"] = "warning";
            return View("Movies/MovieCreate", model);
        }

        if (model.PosterFile != null)
        {
            if (model.PosterFile.Length > 5 * 1024 * 1024)
            {
                TempData["NotificationMessage"] = "Poster file size cannot exceed 5MB.";
                TempData["NotificationType"] = "error";
                return View("Movies/MovieCreate", model);
            }

            var allowedPosterTypes = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var posterExt = Path.GetExtension(model.PosterFile.FileName).ToLower();
            if (!allowedPosterTypes.Contains(posterExt))
            {
                TempData["NotificationMessage"] = "Poster must be JPG, PNG, or WEBP format.";
                TempData["NotificationType"] = "error";
                return View("Movies/MovieCreate", model);
            }
        }

        if (model.HorizontalPosterFile != null)
        {
            string folder = Path.Combine(en.WebRootPath, "MovieUpload/HorizontalPoster");
            Directory.CreateDirectory(folder);

            string ext = Path.GetExtension(model.HorizontalPosterFile.FileName).ToLower();
            string fileName = Guid.NewGuid() + ext;
            string path = Path.Combine(folder, fileName);

            using var fs = new FileStream(path, FileMode.Create);
            await model.HorizontalPosterFile.CopyToAsync(fs);

            model.HorizontalPoster = "/MovieUpload/HorizontalPoster/" + fileName;
        }

        if (model.TrailerFile != null)
        {
            if (model.TrailerFile.Length > 100 * 1024 * 1024)
            {
                TempData["NotificationMessage"] = "Trailer file size cannot exceed 100MB.";
                TempData["NotificationType"] = "error";
                return View("Movies/MovieCreate", model);
            }

            var allowedTrailerTypes = new[] { ".mp4", ".webm", ".mov" };
            var trailerExt = Path.GetExtension(model.TrailerFile.FileName).ToLower();
            if (!allowedTrailerTypes.Contains(trailerExt))
            {
                TempData["NotificationMessage"] = "Trailer must be MP4, WEBM, or MOV format.";
                TempData["NotificationType"] = "error";
                return View("Movies/MovieCreate", model);
            }
        }

        string chosenStatus = model.Status;

        if (chosenStatus != "Cancelled")
        {
            if (model.ReleaseDate.Date < DateTime.Today && chosenStatus != "Showing")
            {
                TempData["NotificationMessage"] = "Release Date is in the past. Status should be 'Showing'.";
                TempData["NotificationType"] = "warning";
                return View("Movies/MovieCreate", model);
            }

            if (model.ReleaseDate.Date > DateTime.Today && chosenStatus != "Upcoming")
            {
                TempData["NotificationMessage"] = "Release Date is in the future. Status should be 'Upcoming'.";
                TempData["NotificationType"] = "warning";
                return View("Movies/MovieCreate", model);
            }
        }

        try
        {
            string newMovieId = "MV000001";
            var lastMovie = await db.Movies.OrderByDescending(m => m.MovieId).FirstOrDefaultAsync();
            if (lastMovie != null)
            {
                int num = int.Parse(lastMovie.MovieId.Substring(2)) + 1;
                newMovieId = "MV" + num.ToString("D6");
            }

            var movie = new Movie
            {
                MovieId = newMovieId,
                Title = model.Title.Trim(),
                Genre = model.Genre,
                Duration = model.Duration,
                Language = model.Language,
                Director = model.Director.Trim(),
                Cast = model.Cast.Trim(),
                Classification = model.Classification,
                Subtitle = model.Subtitle,
                ReleaseDate = model.ReleaseDate,
                Status = chosenStatus,
                Synopsis = string.IsNullOrWhiteSpace(model.Synopsis) ? null : model.Synopsis.Trim(),
                HorizontalPoster = model.HorizontalPoster
            };

            if (model.PosterFile != null)
            {
                string folder = Path.Combine(en.WebRootPath, "MovieUpload/Poster");
                Directory.CreateDirectory(folder);

                string fileExt = Path.GetExtension(model.PosterFile.FileName).ToLower();
                string fileName = Guid.NewGuid().ToString() + fileExt;
                string filePath = Path.Combine(folder, fileName);

                using var fs = new FileStream(filePath, FileMode.Create);
                await model.PosterFile.CopyToAsync(fs);

                movie.Poster = "/MovieUpload/Poster/" + fileName;
            }

            if (model.TrailerFile != null)
            {
                string folder = Path.Combine(en.WebRootPath, "MovieUpload/Trailer");
                Directory.CreateDirectory(folder);

                string fileExt = Path.GetExtension(model.TrailerFile.FileName).ToLower();
                string fileName = Guid.NewGuid().ToString() + fileExt;
                string filePath = Path.Combine(folder, fileName);

                using var fs = new FileStream(filePath, FileMode.Create);
                await model.TrailerFile.CopyToAsync(fs);

                movie.Trailer = "/MovieUpload/Trailer/" + fileName;
            }

            db.Movies.Add(movie);
            await db.SaveChangesAsync();

            TempData["NotificationMessage"] = "Movie created successfully!";
            TempData["NotificationType"] = "success";

            return RedirectToAction("Movies", new { Page = "MovieManagement" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating movie: {ex.Message}");

            TempData["NotificationMessage"] = "Movie creation failed. Please try again.";
            TempData["NotificationType"] = "error";
            return View("Movies/MovieCreate", model);
        }
    }

    public IActionResult MovieDetail(string id)
    {
        var movie = db.Movies
            .Where(m => m.MovieId == id)
            .Select(m => new MovieVM
            {
                MovieId = m.MovieId,
                Title = m.Title,
                Genre = m.Genre,
                Duration = m.Duration,
                Language = m.Language,
                Director = m.Director,
                Cast = m.Cast,
                Classification = m.Classification,
                Subtitle = m.Subtitle,
                ReleaseDate = m.ReleaseDate,
                Status = m.Status,
                Synopsis = m.Synopsis,
                Poster = m.Poster,
                Trailer = m.Trailer,
                HorizontalPoster = m.HorizontalPoster
            })
            .FirstOrDefault();

        if (movie == null)
        {
            TempData["NotificationMessage"] = "Movie not found.";
            TempData["NotificationType"] = "error";
            return RedirectToAction("Movies", new { Page = "MovieManagement" });
        }

        ViewBag.title = "Diamond Screen Cinema - Movie Detail";
        return View("Movies/MovieDetail", movie);
    }

    public IActionResult MovieUpdate(string id)
    {

        if (string.IsNullOrEmpty(id))
        {
            TempData["NotificationMessage"] = "Invalid movie ID.";
            TempData["NotificationType"] = "error";
            return RedirectToAction("Movies", new { Page = "MovieManagement" });
        }

        var movie = db.Movies
            .Where(m => m.MovieId == id)
            .Select(m => new MovieVM
            {
                MovieId = m.MovieId,
                Title = m.Title,
                Genre = m.Genre,
                Duration = m.Duration,
                Language = m.Language,
                Director = m.Director,
                Cast = m.Cast,
                Classification = m.Classification,
                Subtitle = m.Subtitle,
                ReleaseDate = m.ReleaseDate,
                Status = m.Status,
                Synopsis = m.Synopsis,
                Poster = m.Poster,
                Trailer = m.Trailer,
                HorizontalPoster = m.HorizontalPoster,
            })
            .FirstOrDefault();

        if (movie == null)
        {
            TempData["NotificationMessage"] = "Movie not found.";
            TempData["NotificationType"] = "error";
            return RedirectToAction("Movies", new { Page = "MovieManagement" });
        }

        ViewBag.title = "Diamond Screen Cinema - Movie Update";
        return View("Movies/MovieUpdate", movie);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> MovieUpdate(MovieVM vm)
    {
        var movie = db.Movies.FirstOrDefault(m => m.MovieId == vm.MovieId);

        if (movie == null)
        {
            TempData["NotificationMessage"] = "Movie not found.";
            TempData["NotificationType"] = "error";
            return RedirectToAction("Movies", new { Page = "MovieManagement" });
        }

        if (string.IsNullOrWhiteSpace(vm.Title) ||
            string.IsNullOrWhiteSpace(vm.Genre) ||
            vm.Duration <= 0 ||
            string.IsNullOrWhiteSpace(vm.Language) ||
            string.IsNullOrWhiteSpace(vm.Director) ||
            string.IsNullOrWhiteSpace(vm.Cast) ||
            string.IsNullOrWhiteSpace(vm.Classification) ||
            string.IsNullOrWhiteSpace(vm.Subtitle) ||
            vm.ReleaseDate == default)
        {
            TempData["NotificationMessage"] = "Please fill in all required fields.";
            TempData["NotificationType"] = "warning";
            return View("Movies/MovieUpdate", vm);
        }

        if (vm.Title.Length > 200)
        {
            TempData["NotificationMessage"] = "Title cannot exceed 200 characters.";
            TempData["NotificationType"] = "warning";
            return View("Movies/MovieUpdate", vm);
        }

        var existingMovie = await db.Movies
            .FirstOrDefaultAsync(m => m.Title.ToLower() == vm.Title.ToLower() && m.MovieId != vm.MovieId);

        if (existingMovie != null)
        {
            TempData["NotificationMessage"] = "A movie with this title already exists.";
            TempData["NotificationType"] = "warning";
            return View("Movies/MovieUpdate", vm);
        }

        if (vm.Duration < 30 || vm.Duration > 300)
        {
            TempData["NotificationMessage"] = "Duration must be between 30 and 300 minutes.";
            TempData["NotificationType"] = "warning";
            return View("Movies/MovieUpdate", vm);
        }

        if (vm.ReleaseDate.Year < 1900 || vm.ReleaseDate.Year > DateTime.Today.Year + 5)
        {
            TempData["NotificationMessage"] = "Release date must be between 1900 and 5 years from now.";
            TempData["NotificationType"] = "warning";
            return View("Movies/MovieUpdate", vm);
        }


        if (vm.PosterFile != null)
        {

            if (vm.PosterFile.Length > 5 * 1024 * 1024)
            {
                TempData["NotificationMessage"] = "Poster file size cannot exceed 5MB.";
                TempData["NotificationType"] = "error";
                return View("Movies/MovieUpdate", vm);
            }


            var allowedPosterTypes = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var posterExt = Path.GetExtension(vm.PosterFile.FileName).ToLower();
            if (!allowedPosterTypes.Contains(posterExt))
            {
                TempData["NotificationMessage"] = "Poster must be JPG, PNG, or WEBP format.";
                TempData["NotificationType"] = "error";
                return View("Movies/MovieUpdate", vm);
            }
        }

        if (vm.HorizontalPosterFile != null)
        {
            if (vm.HorizontalPosterFile.Length > 5 * 1024 * 1024)
            {
                TempData["NotificationMessage"] = "Horizontal poster cannot exceed 5MB.";
                TempData["NotificationType"] = "error";
                return View("Movies/MovieUpdate", vm);
            }

            var allowedHorizontalTypes = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var hExt = Path.GetExtension(vm.HorizontalPosterFile.FileName).ToLower();

            if (!allowedHorizontalTypes.Contains(hExt))
            {
                TempData["NotificationMessage"] = "Horizontal poster must be JPG, PNG, or WEBP.";
                TempData["NotificationType"] = "error";
                return View("Movies/MovieUpdate", vm);
            }
        }

        if (vm.TrailerFile != null)
        {

            if (vm.TrailerFile.Length > 100 * 1024 * 1024)
            {
                TempData["NotificationMessage"] = "Trailer file size cannot exceed 100MB.";
                TempData["NotificationType"] = "error";
                return View("Movies/MovieUpdate", vm);
            }


            var allowedTrailerTypes = new[] { ".mp4", ".webm", ".mov" };
            var trailerExt = Path.GetExtension(vm.TrailerFile.FileName).ToLower();
            if (!allowedTrailerTypes.Contains(trailerExt))
            {
                TempData["NotificationMessage"] = "Trailer must be MP4, WEBM, or MOV format.";
                TempData["NotificationType"] = "error";
                return View("Movies/MovieUpdate", vm);
            }
        }

        if (vm.Status != "Cancelled")
        {
            if (vm.ReleaseDate.Date < DateTime.Today && vm.Status != "Showing")
            {
                TempData["NotificationMessage"] = "Release Date is in the past. Status should be 'Showing'.";
                TempData["NotificationType"] = "warning";
                return View("Movies/MovieUpdate", vm);
            }

            if (vm.ReleaseDate.Date > DateTime.Today && vm.Status != "Upcoming")
            {
                TempData["NotificationMessage"] = "Release Date is in the future. Status should be 'Upcoming'.";
                TempData["NotificationType"] = "warning";
                return View("Movies/MovieUpdate", vm);
            }
        }

        try
        {
            movie.Title = vm.Title.Trim();
            movie.Genre = vm.Genre;
            movie.Duration = vm.Duration;
            movie.Language = vm.Language;
            movie.Director = vm.Director.Trim();
            movie.Cast = vm.Cast.Trim();
            movie.Classification = vm.Classification;
            movie.Subtitle = vm.Subtitle;
            movie.ReleaseDate = vm.ReleaseDate;
            movie.Status = vm.Status;
            movie.Synopsis = string.IsNullOrWhiteSpace(vm.Synopsis) ? null : vm.Synopsis.Trim();


            if (vm.PosterFile != null)
            {

                if (!string.IsNullOrEmpty(movie.Poster))
                {
                    var oldPosterPath = Path.Combine(en.WebRootPath, movie.Poster.TrimStart('/'));
                    if (System.IO.File.Exists(oldPosterPath))
                    {
                        try
                        {
                            System.IO.File.Delete(oldPosterPath);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Failed to delete old poster: {ex.Message}");

                        }
                    }
                }


                string folder = Path.Combine(en.WebRootPath, "MovieUpload/Poster");
                Directory.CreateDirectory(folder);

                string fileExt = Path.GetExtension(vm.PosterFile.FileName).ToLower();
                string posterName = Guid.NewGuid().ToString() + fileExt;
                string posterPath = Path.Combine(folder, posterName);

                using (var stream = new FileStream(posterPath, FileMode.Create))
                {
                    await vm.PosterFile.CopyToAsync(stream);
                }

                movie.Poster = "/MovieUpload/Poster/" + posterName;
            }

            if (vm.HorizontalPosterFile != null)
            {
                if (!string.IsNullOrEmpty(movie.HorizontalPoster))
                {
                    var oldHPath = Path.Combine(en.WebRootPath, movie.HorizontalPoster.TrimStart('/'));
                    if (System.IO.File.Exists(oldHPath))
                    {
                        try { System.IO.File.Delete(oldHPath); }
                        catch (Exception ex) { Console.WriteLine("Failed to delete old horizontal poster: " + ex.Message); }
                    }
                }

                string folder = Path.Combine(en.WebRootPath, "MovieUpload/HorizontalPoster");
                Directory.CreateDirectory(folder);

                string ext = Path.GetExtension(vm.HorizontalPosterFile.FileName).ToLower();
                string fileName = Guid.NewGuid() + ext;
                string filePath = Path.Combine(folder, fileName);

                using var fs = new FileStream(filePath, FileMode.Create);
                await vm.HorizontalPosterFile.CopyToAsync(fs);

                movie.HorizontalPoster = "/MovieUpload/HorizontalPoster/" + fileName;
            }

            if (vm.HorizontalPosterFile == null && string.IsNullOrEmpty(vm.HorizontalPoster))
            {
                movie.HorizontalPoster = null;
            }

            if (vm.TrailerFile != null)
            {

                if (!string.IsNullOrEmpty(movie.Trailer))
                {
                    var oldTrailerPath = Path.Combine(en.WebRootPath, movie.Trailer.TrimStart('/'));
                    if (System.IO.File.Exists(oldTrailerPath))
                    {
                        try
                        {
                            System.IO.File.Delete(oldTrailerPath);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Failed to delete old trailer: {ex.Message}");

                        }
                    }
                }


                string folder = Path.Combine(en.WebRootPath, "MovieUpload/Trailer");
                Directory.CreateDirectory(folder);

                string fileExt = Path.GetExtension(vm.TrailerFile.FileName).ToLower();
                string trailerName = Guid.NewGuid().ToString() + fileExt;
                string trailerPath = Path.Combine(folder, trailerName);

                using (var stream = new FileStream(trailerPath, FileMode.Create))
                {
                    await vm.TrailerFile.CopyToAsync(stream);
                }

                movie.Trailer = "/MovieUpload/Trailer/" + trailerName;
            }

            await db.SaveChangesAsync();

            TempData["NotificationMessage"] = "Movie updated successfully!";
            TempData["NotificationType"] = "success";
            return RedirectToAction("Movies", new { Page = "MovieManagement" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating movie: {ex.Message}");

            TempData["NotificationMessage"] = "Movie update failed. Please try again.";
            TempData["NotificationType"] = "error";
            return View("Movies/MovieUpdate", vm);
        }
    }

    [HttpPost]
    public async Task<IActionResult> UpdateStatus([FromBody] UpdateStatusRequest request)
    {
        try
        {
            var movie = await db.Movies.FirstOrDefaultAsync(m => m.MovieId == request.Id);

            if (movie == null)
            {
                return Json(new { success = false, message = "Movie not found" });
            }

            string newStatus;

            if (movie.Status == "Cancelled")
            {
                if (movie.ReleaseDate.Date <= DateTime.Today)
                {
                    newStatus = "Showing";
                }
                else
                {
                    newStatus = "Upcoming";
                }
            }
            else
            {
                newStatus = "Cancelled";
            }

            movie.Status = newStatus;
            await db.SaveChangesAsync();

            return Json(new
            {
                success = true,
                message = "Status updated successfully",
                newStatus = newStatus
            });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = "Error updating status: " + ex.Message });
        }
    }

    private DateTime GetCurrentDateInCinemaTimeZone()
    {
        try
        {
            var timeZone = TimeZoneInfo.FindSystemTimeZoneById("Singapore Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone).Date;
        }
        catch
        {
            return DateTime.Today;
        }
    }

    public async Task<IActionResult> AutoUpdateMovieStatuses()
    {
        try
        {
            var currentDate = GetCurrentDateInCinemaTimeZone();

            var upcomingMovies = await db.Movies
                .Where(m => m.Status == "Upcoming" && m.ReleaseDate.Date <= currentDate)
                .ToListAsync();

            foreach (var movie in upcomingMovies)
            {
                movie.Status = "Showing";
            }

            if (upcomingMovies.Any())
            {
                await db.SaveChangesAsync();
            }

            return Json(new { success = true, updated = upcomingMovies.Count });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = ex.Message });
        }
    }
























    /* APIs */
    [HttpGet]
    public async Task<IActionResult> GetSeatLayout(string HallId)
    {
        await EnsureHallExists(HallId);
        var seats = await db.Seats.Where(s => s.HallId == HallId).ToListAsync();
        return Json(seats);
    }

    [HttpPost]
    public async Task<IActionResult> SaveSeatLayout([FromBody] SaveSeatRequest layout)
    {
        Console.WriteLine($"=== SAVE SEAT LAYOUT CALLED ===");
        Console.WriteLine($"HallId: {layout?.HallId}");
        Console.WriteLine($"Rows count: {layout?.Rows?.Count}");

        if (layout == null || string.IsNullOrEmpty(layout.HallId))
            return BadRequest("Invalid seat layout");

        try
        {
            await EnsureHallExists(layout.HallId);

            // Debug: Count existing seats before deletion
            var existingSeatsCount = await db.Seats.CountAsync(s => s.HallId == layout.HallId);
            Console.WriteLine($"Existing seats before deletion: {existingSeatsCount}");

            // Use raw SQL for reliable deletion
            var deleteSql = "DELETE FROM Seats WHERE HallId = {0}";
            var deletedCount = await db.Database.ExecuteSqlRawAsync(deleteSql, layout.HallId);
            Console.WriteLine($"Deleted {deletedCount} seats");

            // Count how many new seats we're adding
            int newSeatsCount = 0;
            var newSeats = new List<Seat>();

            foreach (var row in layout.Rows)
            {
                foreach (var s in row.Seats)
                {
                    if (s.Type == "empty") continue;

                    newSeats.Add(new Seat
                    {
                        SeatId = Guid.NewGuid().ToString(),
                        HallId = layout.HallId,
                        Row = row.RowLabel,
                        Number = s.Number,
                        Type = s.Type,
                        Price = GetSeatPrice(s.Type),
                        Status = true
                    });
                    newSeatsCount++;
                }
            }

            Console.WriteLine($"Attempting to add {newSeatsCount} new seats");

            if (newSeats.Any())
            {
                db.Seats.AddRange(newSeats);
                var savedCount = await db.SaveChangesAsync();
                Console.WriteLine($"Successfully saved {savedCount} seats to database");
            }

            // Verify final count
            var finalSeatsCount = await db.Seats.CountAsync(s => s.HallId == layout.HallId);
            Console.WriteLine($"Final seats count in database: {finalSeatsCount}");
            Console.WriteLine($"=== SAVE COMPLETED ===");

            return Json(new { success = true });
        }
        catch (DbUpdateException ex)
        {
            Console.WriteLine($"DbUpdateException: {ex.Message}");
            Console.WriteLine($"Inner Exception: {ex.InnerException?.Message}");
            return StatusCode(500, $"Server error: {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"General Exception: {ex.Message}");
            return StatusCode(500, $"Server error: {ex.Message}");
        }
    }

    private double GetSeatPrice(string type) => type switch
    {
        "vip" => 30,
        "couple" => 50,
        _ => 20
    };

    private async Task EnsureHallExists(string HallId)
    {
        if (await db.Halls.AnyAsync(h => h.HallId == HallId))
            return;

        var cinema = await db.Cinemas.FirstOrDefaultAsync();
        if (cinema == null)
        {
            cinema = new Cinema
            {
                CinemaId = Guid.NewGuid().ToString(),
                Name = "Default Cinema",
                Address = "123 Main Street",
                ContactNumber = "0123456789",
                LocationCity = "City",
                LocationState = "State",
                CinemaImage = ""
            };
            db.Cinemas.Add(cinema);
            await db.SaveChangesAsync();
        }

        db.Halls.Add(new Hall
        {
            HallId = HallId,
            Name = HallId switch
            {
                "hall1" => "Hall 1 - Main Theater",
                "hall2" => "Hall 2 - Premium Lounge",
                "hall3" => "Hall 3 - Standard",
                "hall4" => "Hall 4 - IMAX",
                _ => "Unknown Hall"
            },
            Type = HallId switch
            {
                "hall1" => "standard",
                "hall2" => "premium",
                "hall3" => "half",
                "hall4" => "imax",
                _ => "standard"
            },
            Status = true,
            CinemaId = cinema.CinemaId,
            Seats = new List<Seat>(),
            Showtimes = new List<Showtime>()
        });

        await db.SaveChangesAsync();
    }
}

public class SaveSeatRequest
{
    public string HallId { get; set; }
    public List<SeatRow> Rows { get; set; }
}

public class SeatRow
{
    public string RowLabel { get; set; }
    public List<SeatDTO> Seats { get; set; }
}

public class SeatDTO
{
    public int Number { get; set; }
    public string Type { get; set; }
}
