// compile:
// g++ honeybee.cpp -o honeybee `pkg-config --cflags --libs opencv`

// vision
#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>

// other
#include <iostream>
#include <fstream>
#include <math.h>
#include <stdio.h>
#include <sys/time.h>
#include <string>

using namespace cv;
using namespace std;

// search type Honeybee or Exhaustive
#define HONEYBEE 0
#define EXHAUSTIVE 1
int search_type = HONEYBEE;
int classic_honeybe = 0;
int draw_converge = 1;

// search type Honeybee or Exhaustive
#define NO_AUTOMATA 0
#define AUTOMATA 1
int automata = NO_AUTOMATA;

// to decide if an operation is done on mu or lambda population
#define MU_SIGNAL 0
#define LAMBDA_SIGNAL 1

// to tell which honeybee search algorithm phase
#define EXP_PHASE 0
#define REC_PHASE 1
#define FOR_PHASE 2

// The properties of the individual bee
struct indiv
{
	double x[2];
	double fit;
};
typedef struct indiv INDIVIDUAL;
typedef INDIVIDUAL *POPULATION;

// general ALOV info
std::string path_alov = "/home/lcd/";
std::string alov_img_dir = "imagedata++/";
std::string alov_ann_dir = "alov300++_rectangleAnnotation_full/";
std::string alov_vid_name = "01-Light";
int alov_vid_num = 1;

// ALOV video info
int initial_frame = 0;
int last_frame = 0;
int initial_u0 = 0;
int initial_v0 = 0;
int initial_w0 = 0;
int initial_h0 = 0;
int u0 = 0;
int v0 = 0;
int w0 = 0;
int h0 = 0;
cv::Mat f_mat;
cv::Mat t_mat;
double elapsed_secs = 0.0;
float maxGamma = 0.0f;

// random numbers
CvRNG rng = cvRNG(0xffffffff);

// Honeybee info
#define EPSILON  1e-6
int mu = 0;
int lambda = 0;
int mu_exp = 0;
int lambda_exp = 0;
int mu_for = 0;
int lambda_for = 0;
int max_gen = 0;
double rate_cross = 0.0;
double rate_mut = 0.0;
double rate_rand = 0.0;
double rate_mut_exp = 0.0;
double rate_cross_exp = 0.0;
double rate_rand_exp = 0.0;
double rate_mut_for = 0.0;
double rate_cross_for = 0.0;
double rate_rand_for = 0.0;
double eta_c = 0.0;
double eta_m = 0.0;
double sigma_share = 0.0;
double sigma_share_back = 0.0;
double r_sharing = 0.0;

// Honeybee global
POPULATION mu_pop;
POPULATION lambda_pop;
POPULATION mu_lambda_pop;
int tour_pos = 0;
int *tour_list;
CvMat *sites;
CvMat *spaces_low;
CvMat *spaces_high;
double* space_low;
double* space_high;
int bad_bees;
int pop_dif = 0;
int real_pop_size = 0;
double rate_dif = 0.0;

// results
std::string path_result = "/home/lcd/result/";
ofstream result_file;

// timing
struct timeval begin;
struct timeval end;

float get_gray(int x, int y, cv::Mat img) {
	Scalar c = img.at<uchar>(cv::Point(x, y));
	float gr = c.val[0] * 1.0f;
	return gr;
}

double distanc(int one, int two) {
	int k;
	double sum, result;

	sum = 0.0;

	for (k=0; k < 2; k++)
		sum += (mu_lambda_pop[one].x[k] - mu_lambda_pop[two].x[k])
			* (mu_lambda_pop[one].x[k] - mu_lambda_pop[two].x[k]);
	result = sqrt(sum);

	return result;
}

double sh(int one, int two) {
	double dist = distanc(one, two);
	if(dist <= sigma_share) {
		return (1 - dist / sigma_share);
	}
	else
		return 0.0;
}

void sharing() {
	// count the bad bees
	bad_bees = 0;
	for(int i = 0; i < mu + lambda; i++) {
		if(mu_lambda_pop[i].fit > -100) {
			double sum = 0.0;
			for(int j = 0; j < mu + lambda; j++) {
				sum += sh(i, j);
			}
			if(sum > 1) {
				bad_bees++;
			}
		}
	}

	// adjust population size and offspring percent
	if ((mu + lambda) > 0) {
		// get the percentage of bad bees
		double bad_bee_percent = (bad_bees) / (mu + lambda);

		// set an increment for the population
		int increment_pop = ((double)(real_pop_size - pop_dif) *
			(bad_bee_percent / 2));

		// decrement the population size if the number of bad bees is too big
		if (bad_bee_percent > 0.6 && 
			real_pop_size - (pop_dif + increment_pop) > 0)
			pop_dif += increment_pop;

		// increment the population size if the number of bad bees is too small
		if (bad_bee_percent < 0.2 && pop_dif >= increment_pop)
			pop_dif -= increment_pop;

		// set new population sizes
		mu = real_pop_size - pop_dif;
		lambda = mu * 2;

		// set an increment for the random offspring
		double increment_off = 0.01;

		// increment the random offspring
		if (bad_bee_percent > 0.5 && rate_cross > rate_dif + increment_off && 
			rate_mut > rate_dif + increment_off)
			rate_dif += increment_off;

		// decrement random offspring
		if (bad_bee_percent < 0.2 && rate_dif >= increment_off)
			rate_dif -= increment_off;
	}
}

/*void debug() {
	// file name
	result_file.open(path_result.c_str(), std::ofstream::app);
	char vid_num_str[5];
	sprintf(vid_num_str, "%05d", alov_vid_num);
	const std::string& file_path = path_result + "video_result" + 
		alov_vid_name + "_" + vid_num_str + ".ann";

	// write file
	result_file.open(file_path.c_str(), std::ofstream::app);
	result_file << "\n===========DEBUG\n";
	result_file << "pop_dif:" << pop_dif << "\n";
	result_file << "mu population:\n";
	for (int i = 0; i < mu; i++) {
		result_file << "(" << mu_pop[i].fit << "," << mu_pop[i].x[0] 
			<< "," << mu_pop[i].x[1] << ") ";
	}
	result_file << "\nlambda population:\n";
	for (int i = 0; i < lambda; i++) {
		result_file << "(" << lambda_pop[i].fit << "," << lambda_pop[i].x[0] 
			<< "," << lambda_pop[i].x[1] << ") ";
	}
	result_file << "\nmu lambda population:\n";
	for (int i = 0; i < mu + lambda; i++) {
		result_file << "(" << mu_lambda_pop[i].fit << "," << mu_lambda_pop[i].x[0] 
			<< "," << mu_lambda_pop[i].x[1] << ") ";
	}
	result_file << "\n===========DEBUG\n";
	result_file.close();
}*/

double get_delta(double u, double delta_l, double delta_u) {
	double delta, aa;

	if (u >= 1.0 - 1.0e-9)
		delta = delta_u;
	else if (u <= 0.0 + 1.0e-9)
		delta = delta_l;
	else	{
		if (u < 0.5) {
			aa = 2.0 * u + (1.0 - 2.0 * u) * pow((1 + delta_l), (eta_m + 1.0));
			delta = pow(aa, (1.0 / (eta_m + 1.0))) - 1.0;
		}
		else {
			aa = 2.0 * (1 - u) + 2.0 * (u - 0.5) * pow((1 - delta_u), (eta_m + 1.0));
	 		delta = 1.0 - pow(aa, (1.0 / (eta_m + 1.0)));
		}
	}

	if (delta < -1.0 || delta > 1.0) {
		cout << "Error in mutation!! delta = " << delta << endl;
		exit(-1);
	}

	return (delta);
}

void q_sort(CvMat* numbers, int left, int right) {
	double pivot, iesimo;
	int l_hold, r_hold;

	l_hold = left;
	r_hold = right;
	pivot = cvmGet(numbers, left, 0);
	iesimo = cvmGet(numbers, left, 1);

	while (left < right) {
		while ((-1 * cvmGet(numbers, right, 0) >= -1 * pivot) && (left < right))
			right--;

		if (left != right) {
			cvmSet(numbers, left, 0, cvmGet(numbers, right, 0));
			cvmSet(numbers, left, 1, cvmGet(numbers, right, 1));
			left++;
		}

		while ((-1 * cvmGet(numbers, left, 0) <= -1 * pivot) && (left < right))
			left++;

		if (left != right) {
			cvmSet(numbers, right, 0, cvmGet(numbers, left, 0));
			cvmSet(numbers, right, 1, cvmGet(numbers, left, 1));
			right--;
		}
	}

	cvmSet(numbers, left, 0, pivot);
	cvmSet(numbers, left, 1, iesimo);
	pivot = (double)left;
	left = l_hold;
	right = r_hold;

	if (left < (int)pivot)
		q_sort(numbers, left, (int)pivot - 1);

	if (right > pivot)
		q_sort(numbers, (int)pivot + 1, right);
}

void quickSort(CvMat *numbers, int array_size) {
	q_sort(numbers, 0, array_size - 1);
}

void init_res_file() {
	// file name
	char vid_num_str[5];
	sprintf(vid_num_str, "%05d", alov_vid_num);
	char gen_str[5];
	sprintf(gen_str, "%05d", max_gen);
	const std::string& file_path = path_result + gen_str + "/video_result" + 
		alov_vid_name + "_" + vid_num_str + ".ann";

	// write file
	result_file.open(file_path.c_str(), std::ofstream::app);
	result_file << alov_vid_name << " " << alov_vid_num << "\n";
	result_file << "frame, u, v, w, h, seconds, gamma\n";

	// first frame
	result_file << initial_frame << "," << initial_u0 << "," << initial_v0
		<< "," << initial_w0 << "," << initial_h0 << ",0,0" << "\n";
	result_file.close();

	std::cout << "\n! Result file created\n";
}

void write_results(int current_frame) {
	// file name
	result_file.open(path_result.c_str(), std::ofstream::app);
	char vid_num_str[5];
	sprintf(vid_num_str, "%05d", alov_vid_num);
	char gen_str[5];
	sprintf(gen_str, "%05d", max_gen);
	const std::string& file_path = path_result + gen_str + "/video_result" + 
		alov_vid_name + "_" + vid_num_str + ".ann";

	// write file
	result_file.open(file_path.c_str(), std::ofstream::app);
	result_file << current_frame << "," << u0 
		<< "," << v0 << "," << w0 << "," << h0 
		<< "," << elapsed_secs << "," << maxGamma << "\n";
	result_file.close();
}

// Read annotation file
void read_ann() {
	// points of the rectangle window
	double ax, ay, bx, by, cx, cy, dx, dy;

	// Open file
	char vid_num_str[5];
	sprintf(vid_num_str, "%05d", alov_vid_num);
	const std::string& ann_path = path_alov + alov_ann_dir + alov_vid_name + '/' +
		alov_vid_name + "_video" + vid_num_str + ".ann";
	FILE* ann_file = fopen(ann_path.c_str(), "r");

	// Read initial position
	fscanf(ann_file, "%d %lf %lf %lf %lf %lf %lf %lf %lf\n",
		&initial_frame, &ax, &ay, &bx, &by, &cx, &cy, &dx, &dy);
	initial_u0 = round(std::min(ax, std::min(bx, std::min(cx, dx))));
	initial_v0 = round(std::min(ay, std::min(by, std::min(cy, dy))));
	initial_w0 = round(std::max(ax, std::max(bx, std::max(cx, dx))) - 
		std::min(ax, std::min(bx, std::min(cx, dx))));
	initial_h0 = round(std::max(ay, std::max(by, std::max(cy, dy))) - 
		std::min(ay, std::min(by, std::min(cy, dy))));

	u0 = initial_u0;
	v0 = initial_v0;
	w0 = initial_w0;
	h0 = initial_h0;

	// Read final frame
	while (fscanf(ann_file, "%d %lf %lf %lf %lf %lf %lf %lf %lf\n",
		&last_frame, &ax, &ay, &bx, &by, &cx, &cy, &dx, &dy) != EOF) {}

	// Close file
	fclose(ann_file);
	std::cout << "\n! Annotation file read\n";

	cout << "Frames: " << initial_frame << " to " << last_frame << "\n";
	cout << "Initial position: " << initial_u0 << ", " << initial_v0 << "\n";
}

// Read config file
void read_config() {
	std::string trash;
	std::ifstream in("./config");

	in >> trash;
	in >> search_type;

	in >> trash;
	in >> automata;

	in >> trash;
	in >> path_alov;

	in >> trash;
	in >> alov_img_dir;

	in >> trash;
	in >> alov_ann_dir;

	in >> trash;
	in >> alov_vid_name;

	in >> trash;
	in >> alov_vid_num;

	in >> trash;
	in >> path_result;

	in >> trash;
	in >> mu_exp;

	in >> trash;
	in >> lambda_exp;

	in >> trash;
	in >> mu_for;

	in >> trash;
	in >> lambda_for;

	in >> trash;
	in >> max_gen;

	in >> trash;
	in >> rate_mut_exp;

	in >> trash;
	in >> rate_cross_exp;

	in >> trash;
	in >> rate_rand_exp;

	in >> trash;
	in >> rate_mut_for;

	in >> trash;
	in >> rate_cross_for;

	in >> trash;
	in >> rate_rand_for;

	in >> trash;
	in >> eta_m;

	in >> trash;
	in >> eta_c;

	in >> trash;
	in >> sigma_share;

	sigma_share_back = sigma_share;

	in.close();
	std::cout << "\n! Config file read\n";

	if (search_type == HONEYBEE) {
		cout << "Using Honeybee Search Algorithm\n";
		cout << "Fitness: NCC/ZNCC\n";
	}
	if (search_type == EXHAUSTIVE) {
		cout << "Using Exhaustive Search\n";
		cout << "Objective: NCC/ZNCC\n";
	}
	cout << "Video: " << alov_vid_name << " " << alov_vid_num << "\n";
	read_ann();
}

// Read a video frame
cv::Mat read_frame(int frame_num) {
	char vid_num_str[5];
	sprintf(vid_num_str, "%05d", alov_vid_num);
	char frame_num_str[8];
	sprintf(frame_num_str, "%08d", frame_num);
	const std::string& vid_path = path_alov + alov_img_dir + alov_vid_name + '/' +
		alov_vid_name + "_video" + vid_num_str + "/" + frame_num_str + ".jpg";

	cout << "frame data read\n";
	return cv::imread(vid_path, CV_LOAD_IMAGE_GRAYSCALE);
}

// Write a video frame
void write_frame(cv::Mat mat, int i) {
	char vid_num_str[5];
	sprintf(vid_num_str, "%05d", alov_vid_num);
	char frame_num_str[8];
	sprintf(frame_num_str, "%08d", i);
	const std::string& vid_path = alov_vid_name + '_' +
		alov_vid_name + "_video" + vid_num_str + "_" + frame_num_str + ".jpg";

	cout << "frame data written\n";
	cv::imwrite(vid_path, mat);
}

void start_timing() {
	gettimeofday(&begin, NULL);
}

void finish_timing() {
	gettimeofday(&end, NULL);
	long int beginl = begin.tv_sec * 1000 + begin.tv_usec / 1000;
	long int endl = end.tv_sec * 1000 + end.tv_usec / 1000;
	elapsed_secs = double(endl - beginl) / 1000;
	printf("Elapsed seconds: %f\n", elapsed_secs);
}

float ncc(int u, int v, int nx, int ny, 
	float* f_filtered, float* t_filtered, double tbar, int mx, int my) {

	// safety
	if (u < 0 || v < 0 || u >= (mx - nx) || v >= (my - ny))
		return -100.0;

	double fbar = 1.0 / (double)(nx * ny);
	double sumfxy = 0.0;
	for (int x = u; x < u + nx; x++) {
		for (int y = v; y < v + ny; y++) {
			float fxy = f_filtered[x + y * mx];
			sumfxy += fxy;
		}
	}
	fbar *= sumfxy;

	double sumft = 0;
	double sumf2 = 0;
	double sumt2 = 0;
	for (int x = u; x < u + nx; x++) {
		for (int y = v; y < v + ny; y++) {
			float fxy = f_filtered[x + y * mx];
			int r_y = v0 + y - v;
			int r_x = u0 + x - u;
			float txy = t_filtered[r_x + r_y * mx];

			double fxyerr = fxy - fbar;
			double txyerr = txy - tbar;

			sumft += fxyerr * txyerr;
			sumf2 += fxyerr * fxyerr;
			sumt2 += txyerr * txyerr;
		}
	}

	double res = sumft / sqrt(sumf2 * sumt2);
	
	//cout << res << "<<-- res\n";

	if (isnan(res))
		return -100;
	else
		return res;
}

void init_random_population(int mx, int my, int nx, int ny) {
	// population size
	mu = mu_exp;
	lambda = mu * 2;

	// variables for the reduction
	real_pop_size = mu;
	pop_dif = 0;
	rate_dif = 0.0;
	sigma_share = sigma_share_back;

	// rates
	rate_cross = rate_cross_exp;
	rate_mut = rate_mut_exp;
	rate_rand = rate_rand_exp;

	// limits of the search space
	space_low = (double*) std::malloc(2 * sizeof(double));
	space_high = (double*) std::malloc(2 * sizeof(double));
	space_low[0] = 0.0;
	space_low[1] = 0.0;
	space_high[0] = mx - nx - 1;
	space_high[1] = my - ny - 1;

	// all populations
	mu_pop = lambda_pop = mu_lambda_pop = NULL;
	mu_pop = new INDIVIDUAL[mu];
	lambda_pop = new INDIVIDUAL[lambda];
	mu_lambda_pop = new INDIVIDUAL[mu + lambda];

	// initial random population
	if (classic_honeybe == 1) {
		for(int k = 0; k < mu; k++) {
			mu_pop[k].fit = 0.0;
			mu_pop[k].x[0] = (double) cvRandReal(&rng) * 
				(space_high[0] - space_low[0]) + space_low[0];
			mu_pop[k].x[1] = (double) cvRandReal(&rng) * 
				(space_high[1] - space_low[1]) + space_low[1];
		}
	} else {
		// First component
		int window = w0;
		if (h0 > w0)
			window = h0;
		double limits0 = u0 + window / 8;
		double limits1 = u0 - window / 8;

		// Second component
		double limits2 = v0 + window / 8;
		double limits3 = v0 - window / 8;

		for(int k = 0; k < mu; k++) {
			mu_pop[k].fit = 0.0;
			mu_pop[k].x[0] = (double) cvRandReal(&rng) * 
				(limits0 - limits1) + limits1;
			mu_pop[k].x[1] = (double) cvRandReal(&rng) * 
				(limits2 - limits3) + limits3;
		}
	}

	if (automata) {
		// get the cardinality / volume / area
		double omega = (space_high[0] - space_low[0]) * (space_high[1] - space_low[1]);

		// get an scalar size
		double edge = pow(omega, (1.0 / 2.0));

		// get th proportion of sigma versus the search space
		r_sharing = sigma_share / edge;
	}
}

void fitness(int pop_signal, int nx, int ny, float* f_filtered, float* t_filtered,
	double tbar, int mx, int my) {

	// which population to evaluate
	POPULATION pop;
	int size = 0;
	if (pop_signal == MU_SIGNAL) {
		pop = mu_pop;
		size = mu;
	}
	if (pop_signal == LAMBDA_SIGNAL) {
		pop = lambda_pop;
		size = lambda;
	}

	// evaluate
	for (int k = 0; k < size; k++) {
		pop[k].fit = ncc(pop[k].x[0], pop[k].x[1], 
			nx, ny, f_filtered, t_filtered, tbar, mx, my);
	}
}

void tour_shuffle() {
	int i, rand1, rand2, temp_site;

	free(tour_list);
	tour_list = (int*) std::malloc(mu * sizeof(int));

	for(i = 0; i < mu; i++)
		tour_list[i] = i;

	for(i = 0; i < mu; i++) {
		rand1 = cvRandInt(&rng) % mu;
		rand2 = cvRandInt(&rng) % mu;
		temp_site = tour_list[rand1];
		tour_list[rand1] = tour_list[rand2];
		tour_list[rand2] = temp_site;
	}
}

void preselect_tour() {
	tour_shuffle();
	tour_pos = 0;
}

int tour_select() {
	int pick, winner, i;

	// emergency reset
	start_select :
	if((mu - tour_pos) < 2) {
		tour_shuffle();
		tour_pos = 0;
	}

	// only one to select
	winner = tour_list[tour_pos];
	if(mu < 2)
		return (winner);

	// nonsense
	if(winner < 0 || winner > mu - 1) {
		preselect_tour();
		goto start_select;
	}

	// select the best
	for(i = 1; i < 2; i++) {
		pick = tour_list[i + tour_pos];

		//nonsense
		if (pick < 0 || pick > mu - 1) {
			preselect_tour();
			getchar();
			goto start_select;
		}

		// decide winner
		if(mu_pop[pick].fit > mu_pop[winner].fit)
			winner = pick;
	}

	// update
	tour_pos += 2;

	return winner;
}

void mutation(int k) {
	double distance1, x, delta_l, delta_u, delta, u;
	int site;

	for (site = 0; site < 2; site++) {
		x = lambda_pop[k].x[site];

		distance1 = space_low[site] - x;
		delta_l = distance1 / (space_high[site] - space_low[site]);

		if (delta_l < -1.0)
			delta_l = -1.0;

		distance1 = space_high[site] - x;
		delta_u = distance1 / (space_high[site] - space_low[site]);

		if (delta_u > 1.0)
			delta_u = 1.0;

		if (-1.0 * delta_l < delta_u)
			delta_u = -1.0 * delta_l;
		else
			delta_l = -1.0 * delta_u;

		u = (double)cvRandReal(&rng);

		// actual delta
		delta = get_delta(u, delta_l, delta_u) * (space_high[site] - space_low[site]);
		lambda_pop[k].x[site] += delta;

		// limits
		if (lambda_pop[k].x[site] < space_low[site])
			lambda_pop[k].x[site] = space_low[site];
		if (lambda_pop[k].x[site] > space_high[site])
			lambda_pop[k].x[site] = space_high[site];
	}
}

double get_beta(double u) {
	double beta;

	if (1.0 - u < EPSILON )
		u = 1.0 - EPSILON;

	if (u < 0.0)
		u = 0.0;

	if (u < 0.5)
		beta = pow(2.0 * u, (1.0 / (eta_c + 1.0)));
	else
		beta = pow((0.5 / (1.0 - u)), (1.0 / (eta_c + 1.0)));

	return beta;
}

void cross_over(int first, int second, int childno1, int childno2) {

	double difference, x_mean, beta, v2, v1;
	double u, distance, umax, temp, alpha;
	int flag;

	for (int site = 0; site < 2; site++) {
		// parents
		double p1 = mu_pop[first].x[site];
		double p2 = mu_pop[second].x[site];

		// limits
		double low = space_low[site];
		double high = space_high[site];

		// check order
		flag = 0;
		if (p1 > p2) {
			temp = p1;
			p1 = p2;
			p2 = temp;
			flag = 1;
		}
		x_mean = (p1 + p2) * 0.5;
		difference = p2 - p1;

		// check limits
		if ((p1 - low) < (high - p2))
			distance = p1- low;
		else
			distance = high - p2;
		if (distance < 0.0)
			distance = 0.0;

		if (difference > EPSILON) {
			alpha = 1.0 + (2.0 * distance / difference);
			umax = 1.0 - (0.5 / pow((double)alpha, (double)(eta_c + 1.0)));
			u = umax * cvRandReal(&rng);
		}
		else
			u = cvRandReal(&rng);

		beta = get_beta(u);
		if (fabs(difference * beta) > INFINITY)
			beta = INFINITY / difference;

		v2 = x_mean + (beta * 0.5 * difference);
		v1 = x_mean - (beta * 0.5 * difference);

		// limits
		if (v2 < low) v2 = low;
		if (v2 > high) v2 = high;
		if (v1 < low) v2 = low;
		if (v1 > high) v2 = high;

		// children
		lambda_pop[childno2].x[site] = v2;
		lambda_pop[childno1].x[site] = v1;
		if (flag == 1) {
			temp = lambda_pop[childno1].x[site];
			lambda_pop[childno1].x[site] = lambda_pop[childno2].x[site];
			lambda_pop[childno2].x[site] = temp;
		}
	}
}

void generate_lambda_pop(int phase) {
	// set number of individuals
	int num_cross, num_mut, num_rand;
	num_cross = lambda * (rate_cross - rate_dif);
	num_mut = lambda * (rate_mut - rate_dif);
	num_rand = lambda * (rate_rand + 2 * rate_dif);

	// verify number of individuals
	if (num_cross % 2 != 0) {
		num_cross++;
	}
	if (num_cross + num_mut + num_rand > lambda) {
		num_mut -= (num_cross + num_mut + num_rand) - lambda;
	}
	if (num_cross + num_mut + num_rand < lambda) {
		num_mut += lambda - (num_cross + num_mut + num_rand);
	}

	// prepare tournament
	preselect_tour();
	int k = 0;

	// mutation
	for(int i = 0; i < num_mut; i++) {
		// selection
		int mate1 = tour_select();

		// copy individual
		lambda_pop[k].x[0] = mu_pop[mate1].x[0];
		lambda_pop[k].x[1] = mu_pop[mate1].x[1];

		// mutate
		mutation(k);

		k++;
	}

	// crossover
	for(int i = 0; i < num_cross; i += 2) {
		int mate1 = tour_select();
		int mate2 = tour_select();

		cross_over(mate1, mate2, k, k + 1);

		k += 2;
	}

	// random
	for(int i = 0; i < num_rand; i++) {
		for (int j = 0; j < 2; j++) {
			lambda_pop[k].x[j] = (double) cvRandReal(&rng) * 
				(space_high[j] - space_low[j]) + space_low[j];
		}
		k++;
	}
}

void merge_pop() {
	int k = 0;
	
	for(int i = 0; i < mu; i++, k++) {
		mu_lambda_pop[k].fit = mu_pop[i].fit;
		mu_lambda_pop[k].x[0] = mu_pop[i].x[0];
		mu_lambda_pop[k].x[1] = mu_pop[i].x[1];
	}

	for(int j = 0; j < lambda; j++, k++) {
		mu_lambda_pop[k].fit = lambda_pop[j].fit;
		mu_lambda_pop[k].x[0] = lambda_pop[j].x[0];
		mu_lambda_pop[k].x[1] = lambda_pop[j].x[1];
	}
}

void best_mu() {
	CvMat *M = cvCreateMat(mu + lambda, 2, CV_32FC1);

	for(int i = 0; i < mu + lambda; i++) {
		CV_MAT_ELEM( *M, float, i, 0) = mu_lambda_pop[i].fit;
		CV_MAT_ELEM( *M, float, i, 1) = (float) i;
	}

	quickSort(M, mu + lambda);

	for(int i = 0; i < mu; i++) {
		mu_pop[i].fit = mu_lambda_pop[(int) CV_MAT_ELEM( *M, float, i, 1)].fit;
		mu_pop[i].x[0] = mu_lambda_pop[(int) CV_MAT_ELEM( *M, float, i, 1)].x[0];
		mu_pop[i].x[1] = mu_lambda_pop[(int) CV_MAT_ELEM( *M, float, i, 1)].x[1];
	}
}

void recruit_assign() {
	double val = 0.0, max, min;

	// info for recruit phase
	spaces_low = cvCreateMat(mu, 2, CV_32FC1);
	spaces_high = cvCreateMat(mu, 2, CV_32FC1);
	sites = cvCreateMat(mu, 1, CV_32FC1);

	// sum of fitness
	for(int i = 0; i < mu; i++) {
		val += fabs(mu_pop[i].fit);
	}

	// percent of fitness
	for(int i = 0; i < mu; i++){
		double num, res;
		num = fabs(mu_pop[i].fit) / val * (double) mu_for;
		if(num <= 3.0) {
			num = 0.0;
		}
		if(modf(num, &res) >= 0.5)
			CV_MAT_ELEM(*sites, float, i, 0) = (int)(num) + 1;
		else
			CV_MAT_ELEM(*sites, float, i, 0) = (int)(num);
	}

	// search space cardinality / area / volume
	double omega = (space_high[0] - space_low[0]) * (space_high[1] - space_low[1]);

	// fair dimension of the reduced search space
	double dimension = pow(omega / mu, (1.0 / 2.0));

	// size of new search spaces
	for(int i = 0; i < mu; i++) {
		int dim_penal = (int) dimension;

		for(int j = 0; j < 2; j++) {
			CV_MAT_ELEM(*spaces_low, float, i, j) = mu_pop[i].x[j] - dim_penal / 2;
			
			if(CV_MAT_ELEM(*spaces_low, float, i, j) < space_low[j])
				CV_MAT_ELEM(*spaces_low, float, i, j) = space_low[j];

			CV_MAT_ELEM(*spaces_high, float, i, j) = mu_pop[i].x[j] + dim_penal / 2;
			
			if(CV_MAT_ELEM(*spaces_high, float, i, j) > space_high[j])
				CV_MAT_ELEM(*spaces_high, float, i, j) = space_high[j];
		}
	}
}

void init_foraging_population(int site_index) {
	// set current populations
	mu = (int) CV_MAT_ELEM(*sites, float, site_index, 0);
	lambda = (int) mu * 2;

	// variables for the reduction
	real_pop_size = mu;
	pop_dif = 0;

	if (automata) {
		// get the cardinality / volume / area
		double omega = (space_high[0] - space_low[0]) * (space_high[1] - space_low[1]);

		// get an scalar size
		double edge = pow(omega, (1.0 / 2.0));

		// set dynamic sigma
		sigma_share = edge * r_sharing;
	}

	// rates
	rate_cross = rate_cross_for;
	rate_mut = rate_mut_for;
	rate_rand = rate_rand_for;

	// set current search space
	for(int k = 0; k < 2; k++) {
		space_low[k] = CV_MAT_ELEM(*spaces_low, float, site_index, k);
		space_high[k] = CV_MAT_ELEM(*spaces_high, float, site_index, k);
	}

	// all populations
	free(mu_pop);
	free(lambda_pop);
	free(mu_lambda_pop);
	mu_pop = lambda_pop = mu_lambda_pop = NULL;
	mu_pop = new INDIVIDUAL[mu];
	lambda_pop = new INDIVIDUAL[lambda];
	mu_lambda_pop = new INDIVIDUAL[mu + lambda];

	// initial constrained random population
	for(int k = 0; k < mu; k++) {
		mu_pop[k].fit = 0.0;
		mu_pop[k].x[0] = (double) cvRandReal(&rng) * 
			(space_high[0] - space_low[0]) + space_low[0];
		mu_pop[k].x[1] = (double) cvRandReal(&rng) * 
			(space_high[1] - space_low[1]) + space_low[1];
	}
}

void video_tracking(int current_frame) {
	// read images
	f_mat = read_frame(current_frame);
	t_mat = read_frame(current_frame - 1);

	// begin time count
	start_timing();

	// stablish frame limits
	int mx = f_mat.cols;
	int my = f_mat.rows;
	int nx = w0;
	int ny = h0;

	// memory allocation for frames and result
	float* gamma;
	if (search_type == EXHAUSTIVE) {
		gamma = (float*) std::malloc(((mx - nx) * (my - ny)) * sizeof(float));
	}
	float* f_filtered = 
		(float*)std::malloc((f_mat.cols * f_mat.rows) * sizeof(float));
	float* t_filtered = 
		(float*)std::malloc((t_mat.cols * t_mat.rows) * sizeof(float));

	// send the image frames to virtual memory for faster processing
	for (int x = 0; x < mx; x++) {
		for (int y = 0; y < my; y++) {
			f_filtered[x + y * mx] = get_gray(x, y, f_mat);
			t_filtered[x + y * mx] = get_gray(x, y, t_mat);
		}
	}

	// varables to move in the frame
	int x = 0;
	int y = 0;
	int u = 0;
	int v = 0;

	// get the mean of t (constant for this frame)
	double tbar = 1 / (double)(nx * ny);
	double sumtxy = 0;
	for (x = 0; x < nx; x++) {
		for (y = 0; y < ny; y++) {
			int r_y = v0 + y;
			int r_x = u0 + x;;
			float txy = t_filtered[r_x + r_y * mx];
			sumtxy += txy;
		}
	}
	tbar *= sumtxy;

	// the new position of the object
	int upos = 0;
	int vpos = 0;

	// exhaustive search
	if (search_type == EXHAUSTIVE) {
		for (u = 0; u < mx - nx; u++) {
			for (v = 0; v < my - ny; v++) {
				// objective function
				gamma[u + v * (mx - nx)] = 
					ncc(u, v, nx, ny, f_filtered, t_filtered, tbar, mx, my);

				// maximize
				if (u == 0 && v == 0) {
					maxGamma = gamma[u + v * (mx - nx)];
					upos = u;
					vpos = v;
				} else if (gamma[u + v * (mx - nx)] > maxGamma) {
					maxGamma = gamma[u + v * (mx - nx)];
					upos = u;
					vpos = v;
				}
			}
		}
	}

	// honeybee search
	if (search_type == HONEYBEE) {
		// exploration
		init_random_population(mx, my, nx, ny);
		fitness(MU_SIGNAL, nx, ny, f_filtered, t_filtered, tbar, mx, my);
		for (int gen_no = 1; gen_no <= max_gen; gen_no++) {
			generate_lambda_pop(EXP_PHASE);
			fitness(LAMBDA_SIGNAL, nx, ny, f_filtered, t_filtered, tbar, mx, my);
			merge_pop();
			if (automata) {
				sharing();
			}
			best_mu();
			
			if (draw_converge == 1 && current_frame == initial_frame + 1) {
				cv::Mat temp = f_mat.clone();
				
				for (int k = 0; k < mu; k++) {
					CvPoint pt1;
					pt1.x = (int)mu_pop[k].x[0];
					pt1.y = (int)mu_pop[k].x[1];

					cv::circle(temp, pt1, 1, CV_RGB(247, 255, 12), -1);
				}

				write_frame(temp, gen_no);
			}
		}

		//debug();

		// save best individual
		maxGamma = mu_pop[0].fit;
		upos = mu_pop[0].x[0];
		vpos = mu_pop[0].x[1];

		// recruitment
		recruit_assign();
		int site_count = mu;

		// foraging
		for (int i = 0; i < site_count; i++) {
			// if the site has enough recruits
			if(CV_MAT_ELEM(*sites, float, i, 0) > 0) {
				init_foraging_population(i);
				fitness(MU_SIGNAL, nx, ny, f_filtered, t_filtered, tbar, mx, my);
				for (int gen_no = 1; gen_no <= max_gen / 2; gen_no++) {
					generate_lambda_pop(FOR_PHASE);
					fitness(LAMBDA_SIGNAL, nx, ny, f_filtered, t_filtered,
						tbar, mx, my);
					merge_pop();
					if (automata) {
						sharing();
					}
					best_mu();
				}

				// replace best if necessary
				if (mu_pop[0].fit > maxGamma) {
					maxGamma = mu_pop[0].fit;
					upos = mu_pop[0].x[0];
					vpos = mu_pop[0].x[1];
				}
			}
		}
	}

	// end time count
	finish_timing();

	// move for next frame
	u0 = upos;
	v0 = vpos;

	// release memory
	if (search_type == EXHAUSTIVE) {
		free(gamma);
	}
	free(f_filtered);
	free(t_filtered);
}

// Main function
int main()
{
	read_config();
	init_res_file();

	// Video tracking for each frame
	for (int current_frame = initial_frame + 1;
		current_frame <= last_frame; current_frame++) {

		printf("Current frame: %d of %d\n", current_frame, last_frame);

		video_tracking(current_frame);

		write_results(current_frame);
	}

	return 0;
}
